
"use client";

import { useState, useRef } from "react";
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Mic, Send, Volume2 } from "lucide-react";
import { useTranslation } from "@/context/translation-context";
import { aiAssistant, AiAssistantOutput } from "@/ai/flows/ai-assistant";
import { useToast } from "@/hooks/use-toast";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";

export default function AiAssistantPage() {
    const { t } = useTranslation();
    const [query, setQuery] = useState("");
    const [lastQuery, setLastQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<AiAssistantOutput | null>(null);
    const [user] = useAuthState(auth);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!query) return;
        
        setLastQuery(query);
        setQuery("");
        setIsLoading(true);
        setResult(null);

        try {
            const res = await aiAssistant({ query });
            setResult(res);
            if (res.audio && audioRef.current) {
                audioRef.current.src = res.audio;
                audioRef.current.play();
            }
        } catch (error) {
            console.error("AI assistant failed:", error);
            toast({
                variant: "destructive",
                title: t('help.errorTitle'),
                description: t('help.errorDesc'),
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    const playAudio = () => {
        if (result?.audio && audioRef.current) {
            audioRef.current.play();
        }
    }

    return (
        <>
            <PageHeader
                title={t('nav.aiAssistant')}
                description={t('schemes.pageDescription')}
            />
            <div className="flex justify-center">
                <Card className="w-full max-w-3xl">
                    <CardHeader>
                        <CardTitle>{t('schemes.assistantTitle')}</CardTitle>
                        <CardDescription>{t('schemes.assistantDescription')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {/* Chat display */}
                            <div className="space-y-4 h-96 overflow-y-auto p-4 border rounded-md bg-secondary/50 flex flex-col">
                                {/* Initial Welcome Message */}
                                <div className="flex items-start gap-3">
                                    <Avatar>
                                        <AvatarImage src="/logo.svg" alt="KisaanConnect Assistant" />
                                        <AvatarFallback>KC</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="font-semibold">{t('schemes.assistantName')}</div>
                                        <div className="p-3 rounded-lg bg-background text-sm max-w-prose">
                                            {t('schemes.welcomeMessage')}
                                        </div>
                                    </div>
                                </div>
                                
                                {/* User's query */}
                                {lastQuery && (
                                     <div className="flex items-start gap-3 justify-end">
                                        <div className="text-right">
                                            <div className="font-semibold">{user?.displayName || "You"}</div>
                                            <div className="p-3 rounded-lg bg-primary text-primary-foreground text-left text-sm max-w-prose">
                                                {lastQuery}
                                            </div>
                                        </div>
                                         <Avatar>
                                            <AvatarImage src={user?.photoURL || ""} alt={user?.displayName || "You"} />
                                            <AvatarFallback>{user?.displayName?.charAt(0) || "Y"}</AvatarFallback>
                                        </Avatar>
                                    </div>
                                )}

                                {/* Loading spinner */}
                                {isLoading && (
                                    <div className="flex items-start gap-3">
                                        <Avatar>
                                            <AvatarImage src="/logo.svg" alt="KisaanConnect Assistant" />
                                            <AvatarFallback>KC</AvatarFallback>
                                        </Avatar>
                                        <div className="p-3 rounded-lg bg-background text-sm">
                                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                        </div>
                                    </div>
                                )}
                                
                                {/* AI's response */}
                                {result && (
                                    <div className="flex items-start gap-3">
                                        <Avatar>
                                            <AvatarImage src="/logo.svg" alt="KisaanConnect Assistant" />
                                            <AvatarFallback>KC</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="font-semibold flex items-center gap-2">
                                                <span>{t('schemes.assistantName')}</span>
                                                <Button variant="ghost" size="icon" onClick={playAudio} className="h-6 w-6">
                                                   <Volume2 className="h-4 w-4" /> 
                                                </Button>
                                            </div>
                                            <div className="p-3 rounded-lg bg-background space-y-2 text-sm max-w-prose">
                                                <p><span className="font-semibold">{t('schemes.summary')}:</span> {result.summary}</p>
                                                <p className="text-muted-foreground"><span className="font-semibold text-foreground">{t('schemes.reasoning')}:</span> {result.reasoning}</p>
                                                <audio ref={audioRef} className="hidden" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Input form */}
                            <form onSubmit={handleSubmit} className="flex items-center gap-2">
                                <Input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder={t('schemes.inputPlaceholder')}
                                    className="flex-1"
                                    disabled={isLoading}
                                />
                                <Button type="button" variant="outline" size="icon" disabled={isLoading}>
                                    <Mic className="h-4 w-4" />
                                </Button>
                                <Button type="submit" disabled={isLoading || !query}>
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                    {t('schemes.send')}
                                </Button>
                            </form>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
