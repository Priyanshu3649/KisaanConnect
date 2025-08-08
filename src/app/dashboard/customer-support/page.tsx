
'use client';

import { useState, useEffect, useRef } from 'react';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Phone, PhoneOff, Bot, Loader2 } from 'lucide-react';
import { useTranslation } from '@/context/translation-context';
import { useAudioPlayer } from '@/context/audio-player-context';
import { processSupportAction, type SupportActionInput, type CallState } from '@/ai/flows/customer-support-ivr';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type CallStatus = 'idle' | 'ringing' | 'connected' | 'ended';

interface LogEntry {
  speaker: 'AI' | 'User';
  text: string;
}

export default function CustomerSupportPage() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<CallStatus>('idle');
  const [callState, setCallState] = useState<CallState>('start');
  const [callContext, setCallContext] = useState<Record<string, any>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [callLog, setCallLog] = useState<LogEntry[]>([]);
  const { initAudio, playAudio, stopAudio } = useAudioPlayer();
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
        ringtoneRef.current = new Audio('/ringtone.mp3');
        ringtoneRef.current.loop = true;
    }
    return () => {
        ringtoneRef.current?.pause();
        stopAudio();
    };
  }, [stopAudio]);

  const startCall = async () => {
    initAudio();
    setCallLog([]);
    setCallState('start');
    setCallContext({});
    setStatus('ringing');
    ringtoneRef.current?.play();
    
    setTimeout(() => {
        if (ringtoneRef.current) {
            ringtoneRef.current.pause();
            ringtoneRef.current.currentTime = 0;
        }
        setStatus('connected');
        processAction({ state: 'start' });
    }, 3000);
  };
  
  const endCall = () => {
    setStatus('ended');
    if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current.currentTime = 0;
    }
    stopAudio();
    setTimeout(() => setStatus('idle'), 2000);
  };

  const processAction = async (input: Partial<SupportActionInput>) => {
    setIsProcessing(true);
    try {
        const fullInput: SupportActionInput = {
            state: input.state || callState,
            language: callContext.language || 'hi',
            context: callContext,
            ...input,
        };
        
        const result = await processSupportAction(fullInput);
        
        setCallState(result.nextState);
        setCallContext(result.context || {});
        setCallLog(prev => [...prev, { speaker: 'AI', text: result.response }]);
        playAudio(result.audio);

    } catch (error) {
        console.error("IVR action failed:", error);
        toast({
            variant: "destructive",
            title: "Call Error",
            description: "An error occurred during the call. Please try again.",
        });
        endCall();
    } finally {
        setIsProcessing(false);
    }
  }

  const handleKeyPress = (key: string) => {
    if (isProcessing || status !== 'connected') return;
    setCallLog(prev => [...prev, { speaker: 'User', text: `Pressed key: ${key}` }]);
    processAction({ userInput: key });
  };


  if (status === 'idle' || status === 'ended') {
    return (
       <>
        <PageHeader
            title={t('nav.customerSupport')}
            description={t('customerSupport.pageDescription')}
        />
        <div className="flex justify-center">
            <Card className="w-full max-w-md text-center">
            <CardHeader>
                <div className="mx-auto bg-primary/10 rounded-full p-4 w-fit">
                    <Bot className="h-12 w-12 text-primary" />
                </div>
                <CardTitle className="mt-4">{t('customerSupport.title')}</CardTitle>
                <CardDescription>{t('customerSupport.description')}</CardDescription>
            </CardHeader>
            <CardContent>
                {status === 'ended' && (
                    <div className="p-4 mb-4 bg-muted text-muted-foreground rounded-lg">Call Ended</div>
                )}
                 <Button size="lg" className="w-full h-16 text-lg" onClick={startCall}>
                    <Phone className="mr-3 h-6 w-6" />
                    {t('customerSupport.callNowButton')}
                </Button>
            </CardContent>
            </Card>
        </div>
      </>
    );
  }

  return (
    <div className="w-full h-full bg-slate-800 text-white flex flex-col items-center justify-between p-4 rounded-lg">
        {/* Call Header */}
        <div className="text-center">
            <p className="text-2xl font-semibold">KisaanConnect Support</p>
            <p className="text-lg text-slate-300 flex items-center gap-2">
                {status === 'ringing' && 'Ringing...'}
                {status === 'connected' && 'Connected'}
                {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
            </p>
        </div>

        {/* Call Log / Main Content */}
        <div className="w-full max-w-md my-4 p-4 bg-black/20 rounded-lg h-64 overflow-y-auto flex flex-col-reverse">
            <div className="space-y-2">
                {[...callLog].reverse().map((log, index) => (
                    <div key={index} className={cn("p-2 rounded-lg text-sm", log.speaker === 'AI' ? 'bg-slate-700 text-left' : 'bg-green-800 text-right')}>
                       <p>{log.text}</p> 
                    </div>
                ))}
            </div>
        </div>

        {/* Dialpad */}
         <div className="grid grid-cols-3 gap-4 w-full max-w-xs">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((key) => (
                <Button key={key} onClick={() => handleKeyPress(key)} className="h-16 text-2xl bg-white/10 hover:bg-white/20" disabled={isProcessing || status !== 'connected'}>
                    {key}
                </Button>
            ))}
        </div>
        
        {/* Call Controls */}
        <div className="flex items-center justify-center gap-4 mt-8">
             <Button variant="destructive" size="lg" className="rounded-full h-16 w-16" onClick={endCall}>
                <PhoneOff className="h-7 w-7" />
            </Button>
        </div>
    </div>
  );
}
