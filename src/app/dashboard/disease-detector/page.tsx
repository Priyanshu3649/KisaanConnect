
'use client';

import { useState, useRef, useEffect } from 'react';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, FileUp, Leaf, Loader2, Bot, UploadCloud, TestTube, ShieldCheck, SprayCan, Info } from 'lucide-react';
import { useTranslation } from '@/context/translation-context';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { detectDisease, type DetectDiseaseOutput } from '@/ai/flows/disease-detector';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db, storage } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const ResultSection = ({ title, content, icon: Icon }: { title: string, content: string, icon: React.ElementType }) => (
    <div>
        <h3 className="font-semibold flex items-center gap-2 mb-2">
            <Icon className="h-5 w-5 text-primary" />
            {title}
        </h3>
        <p className="text-sm text-muted-foreground whitespace-pre-line">{content}</p>
    </div>
);

export default function DiseaseDetectorPage() {
    const { t, language } = useTranslation();
    const [user] = useAuthState(auth);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isDetecting, setIsDetecting] = useState(false);
    const [detectionResult, setDetectionResult] = useState<DetectDiseaseOutput | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setFile(file);
        }
    };

    const setFile = (file: File) => {
        setImageFile(file);
        setDetectionResult(null); // Clear previous result
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const convertFileToDataUri = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
        });
    };

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
                title: 'Camera Error',
                description: 'Could not access the camera. Please check permissions.',
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


    const handleSubmit = async () => {
        if (!imageFile || !user) {
            toast({
                variant: 'destructive',
                title: "Information Missing",
                description: !imageFile ? "Please upload an image to detect diseases." : "You must be logged in to use this feature.",
            });
            return;
        }

        setIsDetecting(true);
        setDetectionResult(null);

        try {
            const photoDataUri = await convertFileToDataUri(imageFile);
            
            // Run AI detection and image upload in parallel
            const diagnosisPromise = detectDisease({ photoDataUri, language });
            
            const storageRef = ref(storage, `diagnoses/${user.uid}/${Date.now()}_${imageFile.name}`);
            const uploadPromise = uploadBytes(storageRef, imageFile);

            const [result, uploadResult] = await Promise.all([diagnosisPromise, uploadPromise]);
            const imageUrl = await getDownloadURL(uploadResult.ref);

            setDetectionResult(result);
            
            // Save the result to Firestore
            await addDoc(collection(db, "diagnoses"), {
                userId: user.uid,
                imageUrl,
                result,
                createdAt: serverTimestamp(),
            });

            toast({
                title: "Analysis Saved",
                description: "Your diagnosis has been saved to your dashboard.",
            });

        } catch (error) {
            console.error("Disease detection failed:", error);
            toast({
                variant: "destructive",
                title: "Detection Failed",
                description: "An unexpected error occurred. Please try again.",
            });
        } finally {
            setIsDetecting(false);
        }
    };

    return (
        <>
            <PageHeader
                title="Disease Detector"
                description="Upload an image of your plant to get an AI-powered disease analysis."
            />
            <div className="grid gap-8 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Upload Plant Image</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div 
                            className="flex items-center justify-center w-full"
                        >
                            <div className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg bg-card hover:bg-secondary relative">
                                {previewUrl ? (
                                    <Image src={previewUrl} alt="Plant preview" fill className="object-contain p-2" />
                                ) : (
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                                        <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
                                        <p className="text-sm text-muted-foreground"><span className="font-semibold">{t('register.clickToUpload')}</span> or take a photo</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                                <FileUp className="mr-2 h-4 w-4" /> Upload File
                            </Button>
                            <Input ref={fileInputRef} id="image-upload-input" type="file" className="hidden" onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" />
                            <Button className="w-full" onClick={() => { setIsCameraOpen(true); startCamera(); }}>
                                <Camera className="mr-2 h-4 w-4" /> Take Photo
                            </Button>
                        </div>
                        <Button onClick={handleSubmit} disabled={isDetecting || !imageFile} className="w-full">
                            {isDetecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                            {isDetecting ? "Detecting Disease..." : "Detect Disease"}
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Analysis Report</CardTitle>
                        <CardDescription>AI-powered review of the plant's health.</CardDescription>
                    </CardHeader>
                    <CardContent className="min-h-[300px]">
                        {isDetecting ? (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                                <p>AI is analyzing your plant. Please wait...</p>
                            </div>
                        ) : detectionResult ? (
                            <div className="space-y-6">
                                <Alert variant={detectionResult.isHealthy ? 'default' : 'destructive'} className={detectionResult.isHealthy ? "border-green-500/50 bg-green-500/10" : ""}>
                                    {detectionResult.isHealthy ? <ShieldCheck className="h-4 w-4 text-green-500" /> : <Info className="h-4 w-4" />}
                                    <AlertTitle className="text-lg font-bold">
                                        {detectionResult.plantName}: {detectionResult.diseaseName}
                                    </AlertTitle>
                                </Alert>
                                
                                <div>
                                    <Label>Confidence</Label>
                                    <div className="flex items-center gap-2">
                                        <Progress value={detectionResult.confidence * 100} className="w-full" />
                                        <span className="font-mono text-sm">{(detectionResult.confidence * 100).toFixed(0)}%</span>
                                    </div>
                                </div>

                                <ResultSection title="Detailed Review" content={detectionResult.detailedReview} icon={TestTube} />
                                <ResultSection title="Organic Treatment" content={detectionResult.organicTreatment} icon={Leaf} />
                                <ResultSection title="Chemical Treatment" content={detectionResult.chemicalTreatment} icon={SprayCan} />
                                <ResultSection title="Prevention Tips" content={detectionResult.preventionTips} icon={ShieldCheck} />

                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                <p>Your analysis report will appear here.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
             <Dialog open={isCameraOpen} onOpenChange={(isOpen) => { if (!isOpen) stopCamera(); setIsCameraOpen(isOpen); }}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Take Photo</DialogTitle>
                        <DialogDescription>Position the plant's affected area in the center of the frame.</DialogDescription>
                    </DialogHeader>
                    <div className="relative aspect-video w-full bg-black rounded-md overflow-hidden">
                        <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                        <canvas ref={canvasRef} className="hidden" />
                    </div>
                    <DialogFooter>
                        <Button onClick={handleTakePhoto} className="w-full">
                            <Camera className="mr-2 h-4 w-4" />
                            Capture Photo
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
