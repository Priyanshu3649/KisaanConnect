// src/app/dashboard/help-feedback/page.tsx
"use client";

import { useState } from "react";
import AppLayout from "@/components/app-layout";
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

export default function HelpFeedbackPage() {
    const [feedbackType, setFeedbackType] = useState("feedback");
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!subject || !message) {
            toast({
                variant: "destructive",
                title: "Missing Information",
                description: "Please fill in the subject and message.",
            });
            return;
        }

        setIsLoading(true);
        try {
            const result = await submitFeedback({
                type: feedbackType,
                subject,
                message,
            });
            
            toast({
                title: "Submission Successful",
                description: result.confirmationMessage,
            });

            // Reset form
            setFeedbackType("feedback");
            setSubject("");
            setMessage("");

        } catch (error) {
            console.error("Feedback submission failed:", error);
            toast({
                variant: "destructive",
                title: "Submission Failed",
                description: "An error occurred. Please try again.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AppLayout>
            <PageHeader
                title="Help & Feedback"
                description="We'd love to hear from you. Let us know how we can improve."
            />
            <div className="flex justify-center">
                <Card className="w-full max-w-2xl">
                    <form onSubmit={handleSubmit}>
                        <CardHeader>
                            <CardTitle>Submit a Request</CardTitle>
                            <CardDescription>
                                Whether it's a bug report or a feature request, use this form to get in touch.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2 md:col-span-1">
                                    <Label htmlFor="type">Type</Label>
                                    <Select value={feedbackType} onValueChange={setFeedbackType}>
                                        <SelectTrigger id="type">
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="feedback">Feedback</SelectItem>
                                            <SelectItem value="bug">Bug Report</SelectItem>
                                            <SelectItem value="feature">Feature Request</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="subject">Subject</Label>
                                    <Input 
                                        id="subject" 
                                        placeholder="e.g., Issue with login page" 
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="message">Message</Label>
                                <Textarea
                                    id="message"
                                    placeholder="Please describe the issue or your feedback in detail..."
                                    rows={8}
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" disabled={isLoading} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <Send className="mr-2 h-4 w-4" />
                                        Submit
                                    </>
                                )}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </AppLayout>
    );
}
