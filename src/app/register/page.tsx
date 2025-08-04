
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Leaf, UploadCloud, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { auth } from '@/lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: ConfirmationResult;
  }
}

export default function RegisterPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [phone, setPhone] = useState('');
    const [aadhaar, setAadhaar] = useState('');
    const [otp, setOtp] = useState('');
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [isGeneratingOtp, setIsGeneratingOtp] = useState(false);

    useEffect(() => {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            'size': 'invisible',
            'callback': (response: any) => {
              // reCAPTCHA solved
            }
        });
      }
    }, []);

    const handleGenerateOtp = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if (!/^\d{10}$/.test(phone)) {
            toast({
                variant: "destructive",
                title: "Invalid Phone Number",
                description: "Please enter a valid 10-digit phone number to receive an OTP.",
            });
            return;
        }
        setIsGeneratingOtp(true);
        try {
            const phoneNumber = "+91" + phone;
            const appVerifier = window.recaptchaVerifier!;
            const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
            window.confirmationResult = confirmationResult;
            setIsOtpSent(true);
            toast({
                title: "OTP Sent",
                description: "An OTP has been sent to your mobile number.",
            });
        } catch (error: any) {
            console.error("Error sending OTP:", error);
            toast({
                variant: "destructive",
                title: "Failed to Send OTP",
                description: error.message || "An error occurred while sending OTP. Please try again.",
            });
        } finally {
            setIsGeneratingOtp(false);
        }
    }

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsGeneratingOtp(true); // Re-use loading state for verification
        try {
            const confirmationResult = window.confirmationResult;
            if (!confirmationResult) {
                throw new Error("Please verify your phone number first.");
            }
            await confirmationResult.confirm(otp);
            toast({
                title: "Registration Successful!",
                description: "Your account has been created.",
            });
            // Here you would typically save user data to your database
            router.push('/dashboard');
        } catch (error: any) {
            console.error("Error during registration:", error);
            toast({
                variant: "destructive",
                title: "Registration Failed",
                description: "The OTP is incorrect or another error occurred.",
            });
        } finally {
            setIsGeneratingOtp(false);
        }
    }
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-background py-12">
       <div id="recaptcha-container"></div>
       <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{backgroundImage: 'url(https://placehold.co/1920x1080.png)'}} data-ai-hint="farm landscape"></div>
      <div className="relative z-10 flex flex-col items-center space-y-4 text-center">
        <div className="flex items-center space-x-2 text-primary">
          <Leaf className="h-12 w-12" />
          <h1 className="font-headline text-5xl font-bold">KisaanConnect</h1>
        </div>
        <p className="text-muted-foreground text-lg">Join our community of empowered farmers.</p>
        <Card className="w-full max-w-lg">
         <form onSubmit={handleRegister}>
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Create an Account</CardTitle>
            <CardDescription>Fill in your details below to get started.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2 text-left">
              <Label htmlFor="name">Full Name <span className="text-destructive">*</span></Label>
              <Input id="name" type="text" placeholder="Your full name" required />
            </div>
             <div className="grid gap-2 text-left">
              <Label htmlFor="age">Age <span className="text-destructive">*</span></Label>
              <Input id="age" type="number" placeholder="Your age" required />
            </div>
             <div className="grid gap-2 text-left md:col-span-2">
              <Label htmlFor="location">Location <span className="text-destructive">*</span></Label>
              <Input id="location" type="text" placeholder="Village, District, State" required />
            </div>
             <div className="grid gap-2 text-left">
              <Label htmlFor="phone">Phone Number <span className="text-destructive">*</span></Label>
              <Input id="phone" type="tel" placeholder="9876543210" required value={phone} onChange={e => setPhone(e.target.value)} disabled={isOtpSent} />
            </div>
            <div className="grid gap-2 text-left">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" placeholder="name@example.com" />
            </div>
            <div className="grid gap-2 text-left md:col-span-2">
                <Label htmlFor="profile-photo">Profile Photo</Label>
                 <label htmlFor="profile-photo-input" className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-secondary">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span></p>
                    </div>
                    <Input id="profile-photo-input" type="file" className="hidden" accept="image/*" />
                 </label>
            </div>
            <div className="grid gap-2 text-left md:col-span-2">
              <Label htmlFor="aadhaar">Aadhaar Number (Optional)</Label>
              <Input id="aadhaar" type="text" placeholder="XXXX XXXX XXXX" value={aadhaar} onChange={(e) => setAadhaar(e.target.value)} />
            </div>
            
            {!isOtpSent ? (
              <div className="md:col-span-2">
                <Button onClick={handleGenerateOtp} disabled={!phone || isGeneratingOtp} className="w-full">
                    {isGeneratingOtp && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Generate OTP
                </Button>
              </div>
            ) : (
                <div className="grid gap-2 text-left md:col-span-2">
                    <Label htmlFor="otp">Verify Phone with OTP</Label>
                    <Input id="otp" type="password" placeholder="Enter 6-digit OTP" value={otp} onChange={e => setOtp(e.target.value)} required />
                </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" style={{backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))'}} disabled={!isOtpSent || !otp || isGeneratingOtp}>
              {isGeneratingOtp && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Register
            </Button>
             <p className="text-xs text-muted-foreground">
                Already have an account?{" "}
                <Link href="/" className="underline underline-offset-4 hover:text-primary">
                    Login here
                </Link>
            </p>
          </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
