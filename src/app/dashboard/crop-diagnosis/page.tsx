
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, FileUp, Leaf, Loader2, Bot, AlertTriangle } from 'lucide-react';
import { useTranslation } from '@/context/translation-context';
import { useToast } from '@/hooks/use-toast';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db, storage } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Image from 'next/image';
import { diagnoseCrop } from '@/ai/flows/crop-disease-diagnosis';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

// Simple markdown parser for the AI response
const ParseMarkdown = ({ text }: { text: string }) => {
    const lines = text.split('\n');
    return (
        <div className="space-y-2 text-sm">
            {lines.map((line, index) => {
                if (line.startsWith('**')) {
                    const parts = line.split('**');
                    return (
                        <div key={index}>
                            <span className="font-semibold text-foreground">{parts[1]}</span>
                            <span>{parts[2]}</span>
                        </div>
                    );
                }
                return <p key={index} className="text-muted-foreground">{line}</p>;
            })}
        </div>
    );
};

export default function CropDiagnosisPage() {
    const { t, language } = useTranslation();
    const [user] = useAuthState(auth);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
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
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
        setDiagnosisResult(null); // Clear previous result
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
                title: t('cropDiagnosis.cameraErrorTitle'),
                description: t('cropDiagnosis.cameraErrorDesc'),
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

    const handleSubmit = useCallback(async () => {
        if (!imageFile) {
            toast({ variant: 'destructive', title: t('cropDiagnosis.missingInfoTitle'), description: t('cropDiagnosis.missingInfoDesc') });
            return;
        }
        if (!user) {
            toast({ variant: 'destructive', title: t('cropDiagnosis.notLoggedInTitle'), description: t('cropDiagnosis.notLoggedInDesc') });
            return;
        }

        setIsDiagnosing(true);
        setDiagnosisResult(null);

        try {
            const reader = new FileReader();
            reader.readAsDataURL(imageFile);
            reader.onloadend = async () => {
                const base64data = reader.result as string;
                
                // Run AI diagnosis and image upload in parallel
                const diagnosisPromise = diagnoseCrop({ photoDataUri: base64data, language });
                const storageRef = ref(storage, `diagnoses/${user.uid}/${Date.now()}_${imageFile.name}`);
                const uploadPromise = uploadBytes(storageRef, imageFile);

                const [diagnosis, uploadResult] = await Promise.all([diagnosisPromise, uploadPromise]);
                const imageUrl = await getDownloadURL(uploadResult.ref);
                
                setDiagnosisResult(diagnosis.analysis);

                // Save result to Firestore
                await addDoc(collection(db, 'diagnoses'), {
                    userId: user.uid,
                    imageUrl: imageUrl,
                    result: diagnosis.analysis,
                    createdAt: serverTimestamp(),
                });
                
                toast({ title: t('cropDiagnosis.savedTitle'), description: t('cropDiagnosis.savedDesc') });
            };
            
        } catch (error) {
            console.error("Diagnosis failed:", error);
            toast({ variant: "destructive", title: t('cropDiagnosis.failedTitle'), description: t('cropDiagnosis.failedDesc') });
            setDiagnosisResult(t('cropDiagnosis.errorResult'));
        } finally {
            setIsDiagnosing(false);
        }
    }, [imageFile, user, language, toast, t]);

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

    useEffect(() => {
        // Automatically submit when an imageFile is set and it's a new file.
        // This is a more robust way to handle the flow from camera capture.
        if (imageFile) {
            handleSubmit();
        }
    }, [imageFile, handleSubmit]);


    return (
        <>
            <PageHeader
                title={t('nav.cropDiagnosis')}
                description={t('cropDiagnosis.pageDescription')}
            />
            <div className="grid gap-8 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('cropDiagnosis.uploadTitle')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="w-full h-64 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/50 relative overflow-hidden">
                            {previewUrl ? (
                                <Image src={previewUrl} alt={t('cropDiagnosis.previewAlt')} fill className="object-contain" />
                            ) : (
                                <div className="text-center text-muted-foreground">
                                    <Leaf className="mx-auto h-12 w-12" />
                                    <p>{t('cropDiagnosis.imagePlaceholder')}</p>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2 justify-center">
                            <Button asChild variant="outline">
                                <label htmlFor="file-upload" className="cursor-pointer">
                                    <FileUp className="mr-2 h-4 w-4" />
                                    {t('cropDiagnosis.browseFiles')}
                                </label>
                            </Button>
                            <input id="file-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} />
                            <Button onClick={() => { setIsCameraOpen(true); startCamera(); }}>
                                <Camera className="mr-2 h-4 w-4" />
                                {t('cropDiagnosis.takePhoto')}
                            </Button>
                        </div>
                    </CardContent>
                    <CardContent>
                        <Button onClick={handleSubmit} disabled={isDiagnosing || !imageFile} className="w-full">
                            {isDiagnosing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                            {isDiagnosing ? t('cropDiagnosis.analyzingButton') : t('cropDiagnosis.diagnoseButton')}
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('cropDiagnosis.resultTitle')}</CardTitle>
                        <CardDescription>{t('cropDiagnosis.resultDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="min-h-[300px]">
                        {isDiagnosing ? (
                             <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                                <p>{t('cropDiagnosis.loadingText')}</p>
                            </div>
                        ) : diagnosisResult ? (
                            <ParseMarkdown text={diagnosisResult} />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                <p>{t('cropDiagnosis.resultsPlaceholder')}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
            
             <Dialog open={isCameraOpen} onOpenChange={(isOpen) => { if (!isOpen) stopCamera(); setIsCameraOpen(isOpen); }}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{t('cropDiagnosis.cameraTitle')}</DialogTitle>
                        <DialogDescription>{t('cropDiagnosis.cameraDesc')}</DialogDescription>
                    </DialogHeader>
                    <div className="relative aspect-video w-full bg-black rounded-md overflow-hidden">
                        <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                        <canvas ref={canvasRef} className="hidden" />
                    </div>
                    <DialogFooter>
                        <Button onClick={handleTakePhoto} className="w-full">
                            <Camera className="mr-2 h-4 w-4" />
                            {t('cropDiagnosis.captureButton')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
