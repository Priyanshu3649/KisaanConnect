
'use client';

import { useState, useRef } from 'react';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, FileUp, Leaf, Loader2, Bot, HeartPulse, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useTranslation } from '@/context/translation-context';
import { useToast } from '@/hooks/use-toast';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db, storage } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Image from 'next/image';
import { analyzeCrop, type AnalyzeCropOutput } from '@/ai/flows/crop-analysis';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';

const ResultSection = ({ title, content }: { title: string; content: string }) => (
    <div>
        <h3 className="font-semibold text-lg mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground whitespace-pre-line">{content}</p>
    </div>
);


export default function CropAnalysisPage() {
    const { t, language } = useTranslation();
    const [user] = useAuthState(auth);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [dataUri, setDataUri] = useState<string | null>(null);
    const [isDiagnosing, setIsDiagnosing] = useState(false);
    const [diagnosisResult, setDiagnosisResult] = useState<AnalyzeCropOutput | null>(null);
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
            const diagnosis = await analyzeCrop({ photoDataUri: dataUri, language });
            setDiagnosisResult(diagnosis);
            
            // Do not save failed diagnoses to Firestore
            if (diagnosis.diseaseName !== "Analysis Failed") {
                const storageRef = ref(storage, `diagnoses/${user.uid}/${Date.now()}_${imageFile.name}`);
                const uploadResult = await uploadBytes(storageRef, imageFile);
                const imageUrl = await getDownloadURL(uploadResult.ref);

                await addDoc(collection(db, 'diagnoses'), {
                    userId: user.uid,
                    imageUrl: imageUrl,
                    result: diagnosis,
                    createdAt: serverTimestamp(),
                });
                
                toast({ title: t('cropAnalysis.savedTitle'), description: t('cropAnalysis.savedDesc') });
            } else {
                 toast({ variant: "destructive", title: t('cropAnalysis.failedTitle'), description: diagnosis.detailedReview });
            }

        } catch (error) {
            console.error("Diagnosis process failed:", error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            toast({ variant: "destructive", title: t('cropAnalysis.failedTitle'), description: errorMessage || t('cropAnalysis.failedDesc') });
             setDiagnosisResult({
                isPlant: false,
                plantName: "Error",
                isHealthy: false,
                diseaseName: "Process Failed",
                confidence: 0,
                detailedReview: "An unexpected error occurred on the server. Please check the console for more details and try again.",
                organicTreatment: "N/A",
                chemicalTreatment: "N/A",
                preventionTips: "If the problem persists, please contact support."
            });
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

    const renderResult = () => {
        if (!diagnosisResult) return null;
        
        const isFailure = diagnosisResult.diseaseName === "Analysis Failed";

        if (isFailure) {
            return (
                 <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>{diagnosisResult.diseaseName}</AlertTitle>
                    <AlertDescription>
                        {diagnosisResult.detailedReview}
                    </AlertDescription>
                </Alert>
            )
        }
        
        return (
            <div className="space-y-4">
                <Alert variant={diagnosisResult.isHealthy ? 'default' : 'destructive'} className={diagnosisResult.isHealthy ? "border-green-500/50 bg-green-500/10" : ""}>
                    {diagnosisResult.isHealthy ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <HeartPulse className="h-4 w-4" />}
                    <AlertTitle className="font-bold">
                        {diagnosisResult.plantName}: {diagnosisResult.isHealthy ? 'Healthy' : diagnosisResult.diseaseName}
                    </AlertTitle>
                </Alert>

                <div>
                    <Label>{t('cropAnalysis.confidence')}</Label>
                    <div className="flex items-center gap-2">
                        <Progress value={diagnosisResult.confidence * 100} className="w-full" />
                        <span>{(diagnosisResult.confidence * 100).toFixed(0)}%</span>
                    </div>
                </div>

                <ResultSection title="Detailed Review" content={diagnosisResult.detailedReview} />
                <ResultSection title="Organic Treatment" content={diagnosisResult.organicTreatment} />
                <ResultSection title="Chemical Treatment" content={diagnosisResult.chemicalTreatment} />
                <ResultSection title="Prevention Tips" content={diagnosisResult.preventionTips} />
            </div>
        )
    }

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
                           renderResult()
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
