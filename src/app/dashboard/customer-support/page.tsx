
'use client';

import { useState, useEffect, useCallback } from 'react';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Phone, Bot, User, Loader2, Send } from 'lucide-react';
import { useTranslation } from '@/context/translation-context';
import { customerSupport, type CustomerSupportOutput } from '@/ai/flows/customer-support';
import { useToast } from '@/hooks/use-toast';
import { useAudioPlayer } from '@/context/audio-player-context';
import { Input } from '@/components/ui/input';

type LogEntry = {
  speaker: 'ai' | 'user';
  text: string;
};

export default function CustomerSupportPage() {
  const { t, language } = useTranslation();
  const { toast } = useToast();
  const { playAudio, stopAudio, isPlaying } = useAudioPlayer();

  const [isCallActive, setIsCallActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState('welcome');
  const [callLog, setCallLog] = useState<LogEntry[]>([]);
  const [userInput, setUserInput] = useState('');
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        (error) => {
          console.warn(`Geolocation error: ${error.message}.`);
        }
      );
    }
  }, []);

  const handleCallAction = async (input?: string) => {
    setIsLoading(true);
    let stepToSend = currentStep;
    let userText = input || '';

    if (!isCallActive) {
      stepToSend = 'welcome';
      setIsCallActive(true);
      setCallLog([]);
    } else {
        if (input) {
            setCallLog(prev => [...prev, { speaker: 'user', text: input }]);
        }
    }

    try {
      const result = await customerSupport({
        step: stepToSend as any,
        userInput: input,
        language: language,
        latitude: currentLocation?.lat,
        longitude: currentLocation?.lon,
      });

      setCallLog(prev => [...prev, { speaker: 'ai', text: result.response }]);
      playAudio(result.audio);

      if (result.isEnd) {
        setIsCallActive(false);
        setCurrentStep('welcome');
      } else {
        setCurrentStep(result.nextStep);
      }
    } catch (error) {
      console.error('Customer support flow failed:', error);
      toast({
        variant: 'destructive',
        title: 'An error occurred',
        description: 'Could not process the request. Please try again.',
      });
      setIsCallActive(false);
    } finally {
      setIsLoading(false);
      setUserInput('');
    }
  };
  
  const handleHangUp = () => {
    stopAudio();
    setIsCallActive(false);
    setCurrentStep('welcome');
    setCallLog([]);
  }

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (userInput.trim()) {
        handleCallAction(userInput);
    }
  }

  const DialpadButton = ({ digit }: { digit: string }) => (
    <Button
      variant="outline"
      className="w-full h-16 text-2xl font-bold"
      onClick={() => handleCallAction(digit)}
      disabled={isLoading || !isCallActive}
    >
      {digit}
    </Button>
  );

  return (
    <>
      <PageHeader
        title="Customer Support"
        description="Get instant help through our AI-powered support line."
      />
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>AI Support Call</CardTitle>
            <CardDescription>Simulate a call to our AI assistant.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-64 w-full bg-muted rounded-lg p-4 overflow-y-auto flex flex-col gap-4">
                {callLog.map((entry, index) => (
                    <div key={index} className={`flex items-start gap-2 ${entry.speaker === 'user' ? 'justify-end' : ''}`}>
                        {entry.speaker === 'ai' && <Bot className="h-6 w-6 text-primary flex-shrink-0" />}
                        <div className={`p-3 rounded-lg text-sm max-w-[80%] ${entry.speaker === 'ai' ? 'bg-background' : 'bg-primary text-primary-foreground'}`}>
                           {entry.text}
                        </div>
                         {entry.speaker === 'user' && <User className="h-6 w-6 text-muted-foreground flex-shrink-0" />}
                    </div>
                ))}
            </div>

            {!isCallActive ? (
              <Button onClick={() => handleCallAction()} className="w-full h-12 text-lg bg-green-500 hover:bg-green-600">
                <Phone className="mr-2 h-5 w-5" /> Start Call
              </Button>
            ) : (
                <Button onClick={handleHangUp} className="w-full h-12 text-lg" variant="destructive">
                    <Phone className="mr-2 h-5 w-5" /> End Call
                </Button>
            )}
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Input</CardTitle>
                <CardDescription>Use the dialpad for menu options or type your response.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                    <DialpadButton digit="1" />
                    <DialpadButton digit="2" />
                    <DialpadButton digit="3" />
                    <DialpadButton digit="4" />
                    <DialpadButton digit="5" />
                    <DialpadButton digit="6" />
                    <DialpadButton digit="7" />
                    <DialpadButton digit="8" />
                    <DialpadButton digit="9" />
                    <DialpadButton digit="*" />
                    <DialpadButton digit="0" />
                    <DialpadButton digit="#" />
                </div>
                <form onSubmit={handleSendText} className="flex gap-2">
                    <Input 
                        placeholder="Type commodity or location..."
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        disabled={isLoading || !isCallActive}
                    />
                    <Button type="submit" disabled={isLoading || !isCallActive || !userInput.trim()}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                </form>
            </CardContent>
        </Card>
      </div>
    </>
  );
}
