
'use client';

import { useState, useRef } from 'react';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUp, Leaf, Loader2, Bot } from 'lucide-react';
import { useTranslation } from '@/context/translation-context';
import { useToast } from '@/hooks/use-toast';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db, storage } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Image from 'next/image';
import { detectDisease, type DetectDiseaseOutput } from '@/ai/flows/disease-detector';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, HeartPulse } from 'lucide-react';

const ResultSection = ({ title, content }: { title: string; content: string }) => (
    <div>
        <h3 className="font-semibold text-lg mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground whitespace-pre-line">{content}</p>
    </div>
);


export default function DiseaseDetectorPage() {
    const { t, language } = useTranslation();
    const [user] = useAuthState(auth);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [dataUri, setDataUri] = useState<string | null>(null);
    const [isDiagnosing, setIsDiagnosing] = useState(false);
    const [diagnosisResult, setDiagnosisResult] = useState<DetectDiseaseOutput | null>(null);
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


    const handleSubmit = async () => {
        if (!imageFile || !user || !dataUri) {
            toast({
                variant: 'destructive',
                title: t('cropDiagnosis.missingInfoTitle'),
                description: !imageFile ? t('cropDiagnosis.missingInfoDesc') : t('cropDiagnosis.notLoggedInDesc')
            });
            return;
        }

        setIsDiagnosing(true);
        setDiagnosisResult(null);

        try {
            const diagnosisPromise = detectDisease({ photoDataUri: dataUri, language });
            
            const storageRef = ref(storage, `diagnoses/${user.uid}/${Date.now()}_${imageFile.name}`);
            const uploadPromise = uploadBytes(storageRef, imageFile);

            const [diagnosis, uploadResult] = await Promise.all([diagnosisPromise, uploadPromise]);
            const imageUrl = await getDownloadURL(uploadResult.ref);
            
            setDiagnosisResult(diagnosis);

            await addDoc(collection(db, 'diagnoses'), {
                userId: user.uid,
                imageUrl: imageUrl,
                result: diagnosis, // Save the full object
                createdAt: serverTimestamp(),
            });
            
            toast({ title: t('cropDiagnosis.savedTitle'), description: t('cropDiagnosis.savedDesc') });
        } catch (error) {
            console.error("Diagnosis process failed:", error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            toast({ variant: "destructive", title: t('cropDiagnosis.failedTitle'), description: errorMessage || t('cropDiagnosis.failedDesc') });
        } finally {
            setIsDiagnosing(false);
        }
    };

    return (
        <>
            <PageHeader
                title={t('nav.diseaseDetector')}
                description={t('cropDiagnosis.pageDescription')}
            />
            <div className="grid gap-8 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('cropDiagnosis.uploadTitle')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                       <label htmlFor="file-upload" className="w-full h-64 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/50 relative overflow-hidden cursor-pointer hover:border-primary">
                            {previewUrl ? (
                                <Image src={previewUrl} alt={t('cropDiagnosis.previewAlt')} fill className="object-contain" />
                            ) : (
                                <div className="text-center text-muted-foreground">
                                    <FileUp className="mx-auto h-12 w-12" />
                                    <p>{t('cropDiagnosis.imagePlaceholder')}</p>
                                </div>
                            )}
                        </label>
                        <input id="file-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} />
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
                           <div className="space-y-4">
                                <Alert variant={diagnosisResult.isHealthy ? 'default' : 'destructive'} className={diagnosisResult.isHealthy ? "border-green-500/50 bg-green-500/10" : ""}>
                                    {diagnosisResult.isHealthy ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <HeartPulse className="h-4 w-4" />}
                                    <AlertTitle className="font-bold">
                                        {diagnosisResult.plantName}: {diagnosisResult.isHealthy ? 'Healthy' : diagnosisResult.diseaseName}
                                    </AlertTitle>
                                </Alert>

                                <div>
                                    <p className="text-sm font-medium mb-1">{t('cropDiagnosis.confidence')}</p>
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
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                <p>{t('cropDiagnosis.resultsPlaceholder')}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
