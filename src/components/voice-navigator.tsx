
'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { processVoiceCommand } from '@/ai/flows/voice-navigator';
import { aiAssistant } from '@/ai/flows/ai-assistant';
import { useTranslation } from '@/context/translation-context';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAudioPlayer } from '@/context/audio-player-context';


const languageToCode: { [key: string]: string } = {
  en: 'en-US',
  hi: 'hi-IN',
  pa: 'pa-IN',
  mr: 'mr-IN',
  ta: 'ta-IN',
  te: 'te-IN',
};

const VoiceAssistant = () => {
  const { t, language } = useTranslation();
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const { playAudio } = useAudioPlayer();

  useEffect(() => {
    if (typeof window === 'undefined' || !('webkitSpeechRecognition' in window)) {
      return;
    }

    if (recognitionRef.current) {
        recognitionRef.current.abort();
    }

    const recognition = new window.webkitSpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = languageToCode[language] || 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = async (event) => {
      const command = event.results[0][0].transcript;
      setIsListening(false);
      setIsProcessing(true);
      toast({ title: t('voice.processing'), description: `${t('voice.heard')}: "${command}"` });

      try {
        // First, try to process as a navigation command
        const navResult = await processVoiceCommand({ command, language });
        if (navResult.action === 'navigate' && navResult.route) {
          router.push(navResult.route);
          toast({ title: t('voice.navigating'), description: navResult.reasoning });
        } else if (navResult.action === 'logout') {
          await signOut(auth);
          router.push('/');
          toast({ title: t('voice.loggingOut'), description: navResult.reasoning });
        } else {
          // If not a navigation command, treat as a general query
          const assistantResult = await aiAssistant({ query: command, language });
          if (assistantResult.audio) {
            playAudio(assistantResult.audio);
          }
          toast({ title: "KisaanConnect Assistant", description: assistantResult.summary });
        }
      } catch (error) {
        console.error('Voice command processing failed:', error);
        toast({ variant: 'destructive', title: t('voice.error'), description: t('voice.tryAgain') });
      } finally {
        setIsProcessing(false);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      setIsProcessing(false);
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        toast({ variant: 'destructive', title: t('voice.micError'), description: t('voice.checkPermissions') });
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      // Don't set processing to false here, as it may still be processing async
    };
    
    return () => {
        if (recognitionRef.current) {
            recognitionRef.current.abort();
        }
    }
  }, [language, router, t, toast, playAudio]);


  const handleMicClick = () => {
    if (!recognitionRef.current) {
      toast({ variant: 'destructive', title: t('voice.notSupported') });
      return;
    }

    if (isListening || isProcessing) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error('Error starting recognition:', e);
         if ((e as DOMException).name === 'InvalidStateError') {
          toast({ variant: 'destructive', title: t('voice.micError'), description: 'The microphone is already active. Please wait.' });
        } else {
          toast({ variant: 'destructive', title: t('voice.micError'), description: (e as Error).message });
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

export default VoiceAssistant;
