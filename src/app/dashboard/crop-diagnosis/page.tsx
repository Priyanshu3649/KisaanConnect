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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Lightbulb, Loader2, UploadCloud, CheckCircle2, AlertCircle, Leaf } from "lucide-react";
import { diagnoseCropDisease, type DiagnoseCropDiseaseOutput } from "@/ai/flows/crop-disease-diagnosis";
import { useToast } from "@/hooks/use-toast";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";


export default function CropDiagnosisPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [result, setResult] = useState<DiagnoseCropDiseaseOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [user] = useAuthState(auth);

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
        title: "Missing Information",
        description: "Please upload a photo and provide a description.",
      });
      return;
    }
    if (!user) {
        toast({
            variant: "destructive",
            title: "Not Logged In",
            description: "You must be logged in to submit a diagnosis.",
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
            title: "Diagnosis Saved",
            description: "Your crop diagnosis has been saved to your dashboard.",
        });

      };
      reader.onerror = (error) => {
        console.error("Error reading file:", error);
        toast({
          variant: "destructive",
          title: "File Read Error",
          description: "Could not read the selected file.",
        });
      };
    } catch (error) {
      console.error("Diagnosis failed:", error);
      toast({
        variant: "destructive",
        title: "Diagnosis Failed",
        description: "An error occurred while analyzing the image.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title="Crop Disease Diagnosis"
        description="Upload an image of your crop to get an AI-powered diagnosis."
      />
      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Submit for Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="crop-image">Crop Image</Label>
                <div className="flex items-center justify-center w-full">
                  <label htmlFor="crop-image-input" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-secondary">
                      {previewUrl ? (
                        <Image src={previewUrl} alt="Crop preview" width={192} height={192} className="h-full w-auto object-contain p-2" />
                      ) : (
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <UploadCloud className="w-8 h-8 mb-4 text-muted-foreground" />
                            <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                            <p className="text-xs text-muted-foreground">PNG, JPG or WEBP (MAX. 5MB)</p>
                        </div>
                      )}
                      <Input id="crop-image-input" type="file" className="hidden" onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" />
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="e.g., 'My tomato plants have yellow leaves with brown spots. The plant seems weak.'"
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
                    Analyzing...
                  </>
                ) : (
                  "Diagnose Crop"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <div className="space-y-4">
            <h2 className="font-headline text-2xl font-semibold">Diagnosis Result</h2>
            {isLoading && (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center border-2 border-dashed rounded-lg bg-card">
                    <Loader2 className="w-12 h-12 mb-4 text-muted-foreground animate-spin" />
                    <p className="text-muted-foreground">AI is analyzing your crop. Please wait...</p>
                </div>
            )}
            {!isLoading && result && (
              <Card className="bg-card">
                 <CardHeader>
                    {result.diseaseIdentification.isDiseased ? (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Disease Detected!</AlertTitle>
                            <AlertDescription>
                                Likely disease: <span className="font-bold">{result.diseaseIdentification.likelyDisease}</span>
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <Alert variant="default" className="border-green-500/50 bg-green-500/10 text-foreground">
                             <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <AlertTitle className="text-green-400">Crop appears healthy!</AlertTitle>
                            <AlertDescription className="text-green-400/80">
                                No significant disease detected based on the analysis.
                            </AlertDescription>
                        </Alert>
                    )}
                 </CardHeader>
                {result.diseaseIdentification.isDiseased && (
                    <CardContent className="space-y-4">
                        <div>
                            <Label>Confidence Level</Label>
                            <div className="flex items-center gap-2">
                                <Progress value={result.diseaseIdentification.confidenceLevel * 100} className="w-full" />
                                <span className="font-mono text-sm">{(result.diseaseIdentification.confidenceLevel * 100).toFixed(0)}%</span>
                            </div>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2 flex items-center gap-2"><Lightbulb className="h-5 w-5 text-primary"/> Recommended Actions</h3>
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
                    <p className="text-muted-foreground">Your diagnosis results will appear here.</p>
                </div>
            )}
        </div>
      </div>
    </AppLayout>
  );
}
