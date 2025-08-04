"use client";

import { useState, useRef } from "react";
import AppLayout from "@/components/app-layout";
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Coins, Loader2, Mic, Sparkles, Volume2, User } from "lucide-react";
import { schemeNavigator, type SchemeNavigatorOutput } from "@/ai/flows/scheme-navigator";
import { useToast } from "@/hooks/use-toast";

export default function SchemeNavigatorPage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<SchemeNavigatorOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!query) {
      toast({
        variant: "destructive",
        title: "Missing Query",
        description: "Please enter a question about government schemes.",
      });
      return;
    }
    setIsLoading(true);
    setResult(null);

    try {
      const navigatorResult = await schemeNavigator({ query });
      setResult(navigatorResult);
      if (audioRef.current) {
        audioRef.current.src = navigatorResult.audio;
        audioRef.current.play();
      }
    } catch (error) {
      console.error("Scheme navigation failed:", error);
      toast({
        variant: "destructive",
        title: "Navigation Failed",
        description: "An error occurred while fetching scheme information.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title="Scheme Navigator"
        description="Ask questions about government subsidies and get instant answers."
      />
      <div className="grid gap-8 md:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>Ask a Question</CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="relative">
                <Textarea
                  id="query"
                  placeholder="e.g., 'What subsidies are available for drip irrigation in Maharashtra?'"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  rows={3}
                  className="pr-12"
                />
                <Button type="button" variant="ghost" size="icon" className="absolute top-1/2 -translate-y-1/2 right-2">
                  <Mic className="h-5 w-5" />
                  <span className="sr-only">Use voice input</span>
                </Button>
              </div>
              <Button type="submit" disabled={isLoading || !query} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Finding Schemes...
                  </>
                ) : (
                  "Get Answer"
                )}
              </Button>
            </CardContent>
          </form>
        </Card>

        <div className="space-y-4">
          <h2 className="font-headline text-2xl font-semibold">AI Generated Response</h2>
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-48 text-center border-2 border-dashed rounded-lg">
              <Loader2 className="w-12 h-12 mb-4 text-muted-foreground animate-spin" />
              <p className="text-muted-foreground">Our AI is searching for the best schemes for you...</p>
            </div>
          )}
          {!isLoading && result ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Your Query</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="italic text-muted-foreground">"{query}"</p>
                </CardContent>
              </Card>
              <Alert className="bg-card">
                <Volume2 className="h-5 w-5 text-primary" />
                <AlertTitle>Voice Answer</AlertTitle>
                <AlertDescription>
                  <audio ref={audioRef} controls className="w-full mt-2" src={result.audio}>
                    Your browser does not support the audio element.
                  </audio>
                </AlertDescription>
              </Alert>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-accent" /> Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{result.summary}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">Reasoning</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-muted-foreground">{result.reasoning}</p>

                </CardContent>
              </Card>
            </div>
          ) : (
             !isLoading && (
                <div className="flex flex-col items-center justify-center h-48 text-center border-2 border-dashed rounded-lg">
                    <Coins className="w-12 h-12 mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Your answer will appear here.</p>
                </div>
            )
          )}
        </div>
      </div>
    </AppLayout>
  );
}
