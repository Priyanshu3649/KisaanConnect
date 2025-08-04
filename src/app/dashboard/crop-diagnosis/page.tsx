"use client";

import { useState } from "react";
import Image from "next/image";
import AppLayout from "@/components/app-layout";
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Lightbulb, Loader2, UploadCloud, CheckCircle2, AlertCircle, Leaf } from "lucide-react";
import { diagnoseCropDisease, type DiagnoseCropDiseaseOutput } from "@/ai/flows/crop-disease-diagnosis";
import { useToast } from "@/hooks/use-toast";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useTranslation } from "@/context/translation-context";


export default function CropDiagnosisPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [result, setResult] = useState<DiagnoseCropDiseaseOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [user] = useAuthState(auth);
  const { t, language } = useTranslation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file || !description) {
      toast({
        variant: "destructive",
        title: t('cropDiagnosis.missingInfoTitle'),
        description: t('cropDiagnosis.missingInfoDesc'),
      });
      return;
    }
    if (!user) {
        toast({
            variant: "destructive",
            title: t('cropDiagnosis.notLoggedInTitle'),
            description: t('cropDiagnosis.notLoggedInDesc'),
        });
        return;
    }
    setIsLoading(true);
    setResult(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const photoDataUri = reader.result as string;
        const diagnosisResult = await diagnoseCropDisease({
          photoDataUri,
          cropDescription: description,
          language: language,
        });
        setResult(diagnosisResult);

        // Save to Firestore
        const diagnosisData = {
            userId: user.uid,
            crop: description.split(' ')[0] || 'Unknown Crop', // Simple crop name extraction
            disease: diagnosisResult.diseaseIdentification.isDiseased ? diagnosisResult.diseaseIdentification.likelyDisease : 'Healthy',
            status: diagnosisResult.diseaseIdentification.isDiseased ? 'Active' : 'Resolved',
            progress: diagnosisResult.diseaseIdentification.isDiseased ? 0 : 100, // Initial progress
            createdAt: serverTimestamp(),
            imageUrl: '', // In a real app, you'd upload the image and store the URL
            isDiseased: diagnosisResult.diseaseIdentification.isDiseased,
            confidence: diagnosisResult.diseaseIdentification.confidenceLevel,
            recommendations: diagnosisResult.recommendedActions
        };

        await addDoc(collection(db, "diagnoses"), diagnosisData);

        toast({
            title: t('cropDiagnosis.savedTitle'),
            description: t('cropDiagnosis.savedDesc'),
        });

      };
      reader.onerror = (error) => {
        console.error("Error reading file:", error);
        toast({
          variant: "destructive",
          title: t('cropDiagnosis.fileReadErrorTitle'),
          description: t('cropDiagnosis.fileReadErrorDesc'),
        });
      };
    } catch (error) {
      console.error("Diagnosis failed:", error);
      toast({
        variant: "destructive",
        title: t('cropDiagnosis.failedTitle'),
        description: t('cropDiagnosis.failedDesc'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title={t('nav.cropDiagnosis')}
        description={t('cropDiagnosis.pageDescription')}
      />
      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>{t('cropDiagnosis.submitTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="crop-image">{t('cropDiagnosis.imageLabel')}</Label>
                <div className="flex items-center justify-center w-full">
                  <label htmlFor="crop-image-input" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-secondary">
                      {previewUrl ? (
                        <Image src={previewUrl} alt={t('cropDiagnosis.previewAlt')} width={192} height={192} className="h-full w-auto object-contain p-2" />
                      ) : (
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <UploadCloud className="w-8 h-8 mb-4 text-muted-foreground" />
                            <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">{t('cropDiagnosis.clickToUpload')}</span> {t('cropDiagnosis.dragAndDrop')}</p>
                            <p className="text-xs text-muted-foreground">{t('cropDiagnosis.fileTypes')}</p>
                        </div>
                      )}
                      <Input id="crop-image-input" type="file" className="hidden" onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" />
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">{t('cropDiagnosis.descriptionLabel')}</Label>
                <Textarea
                  id="description"
                  placeholder={t('cropDiagnosis.descriptionPlaceholder')}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading || !file || !description} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('cropDiagnosis.analyzingButton')}
                  </>
                ) : (
                  t('cropDiagnosis.diagnoseButton')
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <div className="space-y-4">
            <h2 className="font-headline text-2xl font-semibold">{t('cropDiagnosis.resultTitle')}</h2>
            {isLoading && (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center border-2 border-dashed rounded-lg bg-card">
                    <Loader2 className="w-12 h-12 mb-4 text-muted-foreground animate-spin" />
                    <p className="text-muted-foreground">{t('cropDiagnosis.loadingText')}</p>
                </div>
            )}
            {!isLoading && result && (
              <Card className="bg-card">
                 <CardHeader>
                    {result.diseaseIdentification.isDiseased ? (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>{t('cropDiagnosis.diseaseDetected')}</AlertTitle>
                            <AlertDescription>
                                {t('cropDiagnosis.likelyDisease')}: <span className="font-bold">{result.diseaseIdentification.likelyDisease}</span>
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <Alert variant="default" className="border-green-500/50 bg-green-500/10 text-foreground">
                             <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <AlertTitle className="text-green-400">{t('cropDiagnosis.healthy')}</AlertTitle>
                            <AlertDescription className="text-green-400/80">
                                {t('cropDiagnosis.noDisease')}
                            </AlertDescription>
                        </Alert>
                    )}
                 </CardHeader>
                {result.diseaseIdentification.isDiseased && (
                    <CardContent className="space-y-4">
                        <div>
                            <Label>{t('cropDiagnosis.confidence')}</Label>
                            <div className="flex items-center gap-2">
                                <Progress value={result.diseaseIdentification.confidenceLevel * 100} className="w-full" />
                                <span className="font-mono text-sm">{(result.diseaseIdentification.confidenceLevel * 100).toFixed(0)}%</span>
                            </div>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2 flex items-center gap-2"><Lightbulb className="h-5 w-5 text-primary"/> {t('cropDiagnosis.recommendations')}</h3>
                            <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                                {result.recommendedActions.map((action, index) => (
                                    <li key={index}>{action}</li>
                                ))}
                            </ul>
                        </div>
                    </CardContent>
                )}
              </Card>
            )}
            {!isLoading && !result && (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center border-2 border-dashed rounded-lg bg-card">
                    <Leaf className="w-12 h-12 mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">{t('cropDiagnosis.resultsPlaceholder')}</p>
                </div>
            )}
        </div>
      </div>
    </AppLayout>
  );
}
