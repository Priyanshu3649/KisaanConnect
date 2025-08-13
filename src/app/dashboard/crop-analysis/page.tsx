
'use client';

import { useState, useRef } from 'react';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, FileUp, Leaf, Loader2, Bot } from 'lucide-react';
import { useTranslation } from '@/context/translation-context';
import { useToast } from '@/hooks/use-toast';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db, storage } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Image from 'next/image';
import { diagnoseCrop } from '@/ai/flows/crop-disease-diagnosis';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';

// Simple markdown parser for the AI response
const ParseMarkdown = ({ text }: { text: string }) => {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    return (
        <div className="space-y-4 text-sm">
            {lines.map((line, index) => {
                if (line.startsWith('**')) {
                    const parts = line.split('**');
                    const title = parts[1];
                    const content = parts.slice(2).join('**').trim();

                    // Handle multi-line content for sections
                    const contentLines = content.split('- ').filter(c => c.trim() !== '');

                    if (contentLines.length > 1) {
                         return (
                            <div key={index}>
                                <h3 className="font-semibold text-foreground text-base">{title}</h3>
                                <ul className="list-disc pl-5 mt-1 space-y-1 text-muted-foreground">
                                    {contentLines.map((item, i) => <li key={i}>{item.trim()}</li>)}
                                </ul>
                            </div>
                        );
                    }
                    
                    // Handle single line key-value display
                    return (
                         <div key={index} className="grid grid-cols-3 gap-2 items-center">
                            <span className="font-semibold text-foreground col-span-1">{title}</span>
                            <span className="text-muted-foreground col-span-2">{content}</span>
                        </div>
                    );
                }
                return <p key={index} className="text-muted-foreground">{line}</p>;
            })}
        </div>
    );
};

export default function CropAnalysisPage() {
    const { t, language } = useTranslation();
    const [user] = useAuthState(auth);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [dataUri, setDataUri] = useState<string | null>(null);
    const [isDiagnosing, setIsDiagnosing] = useState(false);
    const [diagnosisResult, setDiagnosisResult] = useState<string | null>(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { toast } = useToast();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setFile(file);
        }
    };

    const setFile = (file: File) => {
        setImageFile(file);
        setDiagnosisResult(null); // Clear previous result
        
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result as string);
            setDataUri(reader.result as string);
        };
        reader.readAsDataURL(file);
    }

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (error) {
            console.error('Error accessing camera:', error);
            toast({
                variant: 'destructive',
                title: t('cropAnalysis.cameraErrorTitle'),
                description: t('cropAnalysis.cameraErrorDesc'),
            });
            setIsCameraOpen(false);
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    };

    const handleSubmit = async () => {
        if (!imageFile || !user || !dataUri) {
            toast({
                variant: 'destructive',
                title: t('cropAnalysis.missingInfoTitle'),
                description: !imageFile ? t('cropAnalysis.missingInfoDesc') : t('cropAnalysis.notLoggedInDesc')
            });
            return;
        }

        setIsDiagnosing(true);
        setDiagnosisResult(null);

        try {
            const diagnosis = await diagnoseCrop({ photoDataUri: dataUri, language });
            setDiagnosisResult(diagnosis.analysis);
            
            // Only save if it's not a failure case
            if (!diagnosis.analysis.includes("Analysis Failed")) {
                const storageRef = ref(storage, `diagnoses/${user.uid}/${Date.now()}_${imageFile.name}`);
                const uploadResult = await uploadBytes(storageRef, imageFile);
                const imageUrl = await getDownloadURL(uploadResult.ref);

                await addDoc(collection(db, 'diagnoses'), {
                    userId: user.uid,
                    imageUrl: imageUrl,
                    result: {
                        // Attempt to parse the markdown for structured storage
                        plantName: diagnosis.analysis.match(/\*\*Crop Detected:\*\* (.*)/)?.[1] || 'Unknown',
                        diseaseName: diagnosis.analysis.match(/\*\*Disease\/Issue:\*\* (.*)/)?.[1] || 'Unknown',
                        isHealthy: (diagnosis.analysis.match(/\*\*Disease\/Issue:\*\* (.*)/)?.[1] || '').toLowerCase() === 'healthy',
                    },
                    fullAnalysis: diagnosis.analysis,
                    createdAt: serverTimestamp(),
                });
                
                toast({ title: t('cropAnalysis.savedTitle'), description: t('cropAnalysis.savedDesc') });
            } else {
                 toast({ variant: "destructive", title: t('cropAnalysis.failedTitle'), description: "The API could not process the image." });
            }

        } catch (error) {
            console.error("Diagnosis process failed:", error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            toast({ variant: "destructive", title: t('cropAnalysis.failedTitle'), description: errorMessage || t('cropAnalysis.failedDesc') });
        } finally {
            setIsDiagnosing(false);
        }
    };

    const handleTakePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            canvas.toBlob((blob) => {
                if (blob) {
                    const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
                    setFile(file);
                }
            }, 'image/jpeg');
            stopCamera();
            setIsCameraOpen(false);
        }
    };

    return (
        <>
            <PageHeader
                title={t('nav.cropAnalysis')}
                description={t('cropAnalysis.pageDescription')}
            />
            <div className="grid gap-8 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('cropAnalysis.uploadTitle')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <label htmlFor="file-upload" className="w-full h-64 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/50 relative overflow-hidden cursor-pointer hover:border-primary">
                            {previewUrl ? (
                                <Image src={previewUrl} alt={t('cropAnalysis.previewAlt')} fill className="object-contain" />
                            ) : (
                                <div className="text-center text-muted-foreground">
                                    <FileUp className="mx-auto h-12 w-12" />
                                    <p>{t('cropAnalysis.imagePlaceholder')}</p>
                                </div>
                            )}
                        </label>
                        <input id="file-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} />
                        
                        <div className="flex gap-2 justify-center">
                             <Button onClick={() => { setIsCameraOpen(true); startCamera(); }}>
                                <Camera className="mr-2 h-4 w-4" />
                                {t('cropAnalysis.takePhoto')}
                            </Button>
                        </div>

                    </CardContent>
                    <CardContent>
                        <Button onClick={handleSubmit} disabled={isDiagnosing || !imageFile} className="w-full">
                            {isDiagnosing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                            {isDiagnosing ? t('cropAnalysis.analyzingButton') : t('cropAnalysis.diagnoseButton')}
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('cropAnalysis.resultTitle')}</CardTitle>
                        <CardDescription>{t('cropAnalysis.resultDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="min-h-[300px]">
                        {isDiagnosing ? (
                             <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                                <p>{t('cropAnalysis.loadingText')}</p>
                            </div>
                        ) : diagnosisResult ? (
                           <ParseMarkdown text={diagnosisResult} />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                <p>{t('cropAnalysis.resultsPlaceholder')}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
            
             <Dialog open={isCameraOpen} onOpenChange={(isOpen) => { if (!isOpen) stopCamera(); setIsCameraOpen(isOpen); }}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{t('cropAnalysis.cameraTitle')}</DialogTitle>
                        <DialogDescription>{t('cropAnalysis.cameraDesc')}</DialogDescription>
                    </DialogHeader>
                    <div className="relative aspect-video w-full bg-black rounded-md overflow-hidden">
                        <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                        <canvas ref={canvasRef} className="hidden" />
                    </div>
                    <DialogFooter>
                        <Button onClick={handleTakePhoto} className="w-full">
                            <Camera className="mr-2 h-4 w-4" />
                            {t('cropAnalysis.captureButton')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
