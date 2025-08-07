
"use client";

import { useState } from "react";
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send } from "lucide-react";
import { submitFeedback } from "@/ai/flows/submit-feedback";
import { useTranslation } from "@/context/translation-context";

export default function HelpFeedbackPage() {
    const [feedbackType, setFeedbackType] = useState("feedback");
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const { t, language } = useTranslation();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!subject || !message) {
            toast({
                variant: "destructive",
                title: t('help.missingInfoTitle'),
                description: t('help.missingInfoDesc'),
            });
            return;
        }

        setIsLoading(true);
        try {
            const result = await submitFeedback({
                type: feedbackType,
                subject,
                message,
                language: language,
            });
            
            toast({
                title: t('help.successTitle'),
                description: `${result.confirmationMessage} ${t('help.ticketId')}: ${result.ticketId}.`,
            });

            // Reset form
            setFeedbackType("feedback");
            setSubject("");
            setMessage("");

        } catch (error) {
            console.error("Feedback submission failed:", error);
            toast({
                variant: "destructive",
                title: t('help.errorTitle'),
                description: t('help.errorDesc'),
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <PageHeader
                title={t('nav.helpAndFeedback')}
                description={t('help.pageDescription')}
            />
            <div className="flex justify-center">
                <Card className="w-full max-w-2xl">
                    <form onSubmit={handleSubmit}>
                        <CardHeader>
                            <CardTitle>{t('help.formTitle')}</CardTitle>
                            <CardDescription>
                                {t('help.formDescription')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2 md:col-span-1">
                                    <Label htmlFor="type">{t('help.typeLabel')}</Label>
                                    <Select value={feedbackType} onValueChange={setFeedbackType}>
                                        <SelectTrigger id="type">
                                            <SelectValue placeholder={t('help.selectType')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="feedback">{t('help.typeFeedback')}</SelectItem>
                                            <SelectItem value="bug">{t('help.typeBug')}</SelectItem>
                                            <SelectItem value="feature">{t('help.typeFeature')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="subject">{t('help.subjectLabel')}</Label>
                                    <Input 
                                        id="subject" 
                                        placeholder={t('help.subjectPlaceholder')}
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="message">{t('help.messageLabel')}</Label>
                                <Textarea
                                    id="message"
                                    placeholder={t('help.messagePlaceholder')}
                                    rows={8}
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {t('help.submittingButton')}
                                    </>
                                ) : (
                                    <>
                                        <Send className="mr-2 h-4 w-4" />
                                        {t('help.submitButton')}
                                    </>
                                )}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </>
    );
}
