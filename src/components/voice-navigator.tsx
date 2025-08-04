
'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { processVoiceCommand } from '@/ai/flows/voice-navigator';
import { useTranslation } from '@/context/translation-context';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const VoiceNavigator = () => {
  const { t, language } = useTranslation();
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window)) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = async (event) => {
        const command = event.results[0][0].transcript;
        setIsListening(false);
        setIsProcessing(true);
        toast({ title: t('voice.processing'), description: `${t('voice.heard')}: "${command}"` });
        
        try {
          const result = await processVoiceCommand({ command, language });
          if (result.action === 'navigate' && result.route) {
            router.push(result.route);
            toast({ title: t('voice.navigating'), description: result.reasoning });
          } else if (result.action === 'logout') {
            await signOut(auth);
            router.push('/');
            toast({ title: t('voice.loggingOut'), description: result.reasoning });
          } else {
             toast({ variant: "destructive", title: t('voice.notUnderstood'), description: result.reasoning });
          }
        } catch (error) {
          console.error("Voice command processing failed:", error);
          toast({ variant: "destructive", title: t('voice.error'), description: t('voice.tryAgain') });
        } finally {
            setIsProcessing(false);
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setIsProcessing(false);
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
            toast({ variant: "destructive", title: t('voice.micError'), description: t('voice.checkPermissions') });
        }
      };

      recognition.onend = () => {
        if (isListening) {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
    }
  }, [language, router, t, toast, isListening]);

  const handleMicClick = () => {
    if (!recognitionRef.current) {
      toast({ variant: "destructive", title: t('voice.notSupported') });
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        // Ensure language is up-to-date before starting
        recognitionRef.current.lang = language === 'hi' ? 'hi-IN' : 'en-US';
        recognitionRef.current.start();
      } catch(e) {
        console.error("Error starting recognition:", e);
        // It's possible the service is already running, so don't show an error unless it's a new one.
        if ((e as DOMException).name === 'InvalidStateError') {
          // Ignore this error as it means it's already listening
        } else {
          toast({ variant: "destructive", title: t('voice.micError'), description: (e as Error).message });
        }
      }
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        size="icon"
        className={`rounded-full h-16 w-16 shadow-lg transition-all duration-300 ${isListening ? 'bg-red-500 hover:bg-red-600 scale-110' : 'bg-primary hover:bg-primary/90'}`}
        onClick={handleMicClick}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <Loader2 className="h-7 w-7 animate-spin" />
        ) : isListening ? (
          <MicOff className="h-7 w-7" />
        ) : (
          <Mic className="h-7 w-7" />
        )}
      </Button>
    </div>
  );
};

// Add SpeechRecognition to window type
declare global {
    interface Window {
      webkitSpeechRecognition: any;
    }
}


export default VoiceNavigator;
