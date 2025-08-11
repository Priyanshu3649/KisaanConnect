
"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Lightbulb, Loader2, UploadCloud, CheckCircle2, AlertCircle, Leaf, Camera, VideoOff } from "lucide-react";
import { diagnoseCropDisease, type DiagnoseCropDiseaseOutput } from "@/ai/flows/crop-disease-diagnosis";
import { useToast } from "@/hooks/use-toast";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db, storage } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { useTranslation } from "@/context/translation-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

// Helper function to read file as Data URI
const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

const dataUriToBlob = (dataUri: string): Blob => {
    const byteString = atob(dataUri.split(',')[1]);
    const mimeString = dataUri.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
};


export default function CropDiagnosisPage() {
  const [file, setFile] = useState<File | null>(null);
  const [dataUri, setDataUri] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [result, setResult] = useState<DiagnoseCropDiseaseOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [user] = useAuthState(auth);
  const { t, language } = useTranslation();

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const getCameraPermission = async () => {
      if (isCameraOpen) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
          streamRef.current = stream;
          setHasCameraPermission(true);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
          toast({
            variant: 'destructive',
            title: 'Camera Access Denied',
            description: 'Please enable camera permissions in your browser settings.',
          });
        }
      } else {
        // Stop the camera stream when the dialog is closed
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
      }
    };
    getCameraPermission();

    return () => {
       if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    }
  }, [isCameraOpen, toast]);


  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      const uri = await fileToDataUri(selectedFile);
      setDataUri(uri);
    }
  };

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const capturedDataUri = canvas.toDataURL('image/jpeg');
        setDataUri(capturedDataUri);
        setFile(null); // It's not a file from disk
        setIsCameraOpen(false);
        await handleSubmit(null, capturedDataUri); // Directly submit after capture
    }
  };


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement> | null, capturedUri?: string) => {
    e?.preventDefault();
    const photoDataUri = capturedUri || dataUri;

    if (!photoDataUri) {
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
        const diagnosisPromise = diagnoseCropDisease({
            photoDataUri,
            cropDescription: description,
            language: language,
        });

        const uploadPromise = (async () => {
            const storageRef = ref(storage, `diagnoses/${user.uid}/${Date.now()}.jpg`);
            await uploadString(storageRef, photoDataUri, 'data_url');
            return getDownloadURL(storageRef);
        })();
        
        const [diagnosisResult, imageUrl] = await Promise.all([diagnosisPromise, uploadPromise]);
        
        setResult(diagnosisResult);

        const diagnosisData = {
            userId: user.uid,
            crop: description.split(' ')[0] || 'Unknown Crop',
            disease: diagnosisResult.diseaseIdentification.isDiseased ? diagnosisResult.diseaseIdentification.likelyDisease : 'Healthy',
            status: diagnosisResult.diseaseIdentification.isDiseased ? 'Active' : 'Resolved',
            progress: diagnosisResult.diseaseIdentification.isDiseased ? 0 : 100,
            createdAt: serverTimestamp(),
            imageUrl: imageUrl,
            isDiseased: diagnosisResult.diseaseIdentification.isDiseased,
            confidence: diagnosisResult.diseaseIdentification.confidenceLevel,
            recommendations: diagnosisResult.recommendedActions
        };

        await addDoc(collection(db, "diagnoses"), diagnosisData);

        toast({
            title: t('cropDiagnosis.savedTitle'),
            description: t('cropDiagnosis.savedDesc'),
        });

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
    <>
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
                       {dataUri ? (
                         <Image src={dataUri} alt={t('cropDiagnosis.previewAlt')} width={192} height={192} className="h-full w-auto object-contain p-2" />
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
                <Label htmlFor="description">{t('cropDiagnosis.descriptionLabel')} <span className="text-xs text-muted-foreground">({t('optional')})</span></Label>
                <Textarea
                  id="description"
                  placeholder={t('cropDiagnosis.descriptionPlaceholder')}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>
            </CardContent>
            <CardFooter className="flex-col sm:flex-row gap-2">
                <Dialog open={isCameraOpen} onOpenChange={setIsCameraOpen}>
                    <DialogTrigger asChild>
                        <Button type="button" variant="outline" className="w-full sm:w-auto">
                            <Camera className="mr-2 h-4 w-4"/>
                            Take Photo
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl">
                        <DialogHeader>
                            <DialogTitle>Camera</DialogTitle>
                        </DialogHeader>
                        <div className="relative aspect-video w-full bg-black rounded-md overflow-hidden flex items-center justify-center">
                            <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                            <canvas ref={canvasRef} className="hidden" />
                            {hasCameraPermission === false && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white bg-black/50 p-4">
                                    <VideoOff className="h-12 w-12 mb-4" />
                                    <p className="font-semibold">Camera Access Denied</p>
                                    <p className="text-sm">Please enable camera permissions in your browser settings to use this feature.</p>
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCapture} disabled={!hasCameraPermission}>
                                <Camera className="mr-2 h-4 w-4"/>
                                Capture & Analyze
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
              <Button type="submit" disabled={isLoading || !dataUri} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
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
    </>
  );
}
