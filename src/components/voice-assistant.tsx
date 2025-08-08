
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
import { cn } from '@/lib/utils';


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
  const { initAudio, playAudio, playStartSound, stopAudio, isPlaying } = useAudioPlayer();
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lon: number} | null>(null);

  // Function to get current location
  const updateLocation = () => {
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
  }
  
  useEffect(() => {
    updateLocation();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !('webkitSpeechRecognition' in window)) {
      console.warn('Speech recognition not supported');
      return;
    }

    const SpeechRecognition = window.webkitSpeechRecognition;
    if (!recognitionRef.current) {
        recognitionRef.current = new SpeechRecognition();
    }
    const recognition = recognitionRef.current;
    
    recognition.lang = languageToCode[language] || 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      playStartSound();
    };

    recognition.onresult = async (event: SpeechRecognitionEvent) => {
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
           setIsProcessing(false);
        } else if (navResult.action === 'logout') {
          await signOut(auth);
          router.push('/');
          toast({ title: t('voice.loggingOut'), description: navResult.reasoning });
           setIsProcessing(false);
        } else {
          // If not a navigation command, treat as a general query
           updateLocation(); // Refresh location just before making the call
           const assistantResult = await aiAssistant({ 
                query: command, 
                language,
                latitude: currentLocation?.lat,
                longitude: currentLocation?.lon,
            });
          if (assistantResult.audio) {
            playAudio(assistantResult.audio, () => {
                // When audio finishes, re-activate microphone
                setIsProcessing(false);
                // Re-enable listening after response if needed
                // handleMicClick(); // Uncomment for continuous conversation
            });
          } else {
             setIsProcessing(false);
          }
          toast({ title: "KisaanConnect Assistant", description: assistantResult.summary });
        }
      } catch (error) {
        console.error('Voice command processing failed:', error);
        toast({ variant: 'destructive', title: t('voice.error'), description: t('voice.tryAgain') });
        setIsProcessing(false);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      setIsProcessing(false);
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        toast({ variant: 'destructive', title: t('voice.micError'), description: t('voice.checkPermissions') });
      }
    };

    recognition.onend = () => {
      if (isListening) {
        setIsListening(false);
      }
    };
    
    // No return cleanup needed if we are reusing the same instance.
  }, [language, router, t, toast, playAudio, playStartSound, currentLocation, isListening]);


  const handleMicClick = () => {
    initAudio(); // Ensure audio context is ready on first click.

    if (!recognitionRef.current) {
      toast({ variant: 'destructive', title: t('voice.notSupported') });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else if (isProcessing && isPlaying) {
      stopAudio(); // Stop TTS playback
      setIsProcessing(false);
    }
    else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error('Error starting recognition:', e);
        // If it's already started, this will throw. We can safely ignore it.
        if ((e as DOMException).name !== 'InvalidStateError') {
             toast({ variant: 'destructive', title: t('voice.micError'), description: (e as Error).message });
        }
      }
    }
  };

  return (
    <div className="fixed bottom-24 right-6 z-50 md:bottom-8 md:right-8">
      <Button
        size="icon"
        className={cn(
            "rounded-full h-16 w-16 shadow-lg transition-all duration-300 relative overflow-hidden",
            isListening || isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-primary/90'
        )}
        onClick={handleMicClick}
        disabled={isProcessing && !isPlaying}
      >
        {isListening && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>}
        
        {isProcessing && !isPlaying ? (
          <Loader2 className="h-7 w-7 animate-spin" />
        ) : isListening || isPlaying ? (
          <MicOff className="h-7 w-7" />
        ) : (
          <Mic className="h-7 w-7" />
        )}
      </Button>
    </div>
  );
};

// Add SpeechRecognitionEvent types to window
declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
  interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
  }
  interface SpeechRecognitionErrorEvent extends Event {
      error: string;
  }
}

export default VoiceAssistant;
