
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Leaf } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { auth } from '@/lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';

// Extend window type to include recaptchaVerifier
declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: ConfirmationResult;
  }
}

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      'size': 'invisible',
      'callback': (response: any) => {
        // reCAPTCHA solved, allow signInWithPhoneNumber.
      }
    });
  }, []);

  const handleSendOtp = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(phone)) {
      toast({
        variant: "destructive",
        title: "Invalid Phone Number",
        description: "Please enter a valid 10-digit phone number.",
      });
      return;
    }
    setIsLoading(true);
    
    try {
      const phoneNumber = "+91" + phone;
      const appVerifier = window.recaptchaVerifier!;
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      window.confirmationResult = confirmationResult;
      setOtpSent(true);
      toast({
        title: "OTP Sent",
        description: "An OTP has been sent to your phone number.",
      });
    } catch (error: any) {
      console.error("Error sending OTP:", error);
      toast({
        variant: "destructive",
        title: "Failed to Send OTP",
        description: error.message || "An error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = () => {
    // This logic is mostly the same as handleSendOtp, can be refactored
     handleSendOtp(new MouseEvent('click') as any);
     toast({
        title: "OTP Resent",
        description: "A new OTP has been sent to your phone number.",
    });
  }

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const confirmationResult = window.confirmationResult;
      if (!confirmationResult) {
          throw new Error("No confirmation result found.");
      }
      await confirmationResult.confirm(otp);
      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });
      router.push('/dashboard');
    } catch (error: any) {
      console.error("Error verifying OTP:", error);
       toast({
        variant: "destructive",
        title: "Login Failed",
        description: "The OTP you entered is incorrect. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }


  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-background">
      <div id="recaptcha-container"></div>
       <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{backgroundImage: 'url(https://placehold.co/1920x1080.png)'}} data-ai-hint="farm landscape"></div>
      <div className="relative z-10 flex flex-col items-center space-y-4 text-center">
        <div className="flex items-center space-x-2 text-primary">
          <Leaf className="h-12 w-12" />
          <h1 className="font-headline text-5xl font-bold">KisaanConnect</h1>
        </div>
        <p className="text-muted-foreground text-lg">Empowering Indian farmers through technology.</p>
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Welcome Back!</CardTitle>
            <CardDescription>Enter your phone number to login with OTP.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" placeholder="9876543210" required value={phone} onChange={(e) => setPhone(e.target.value)} disabled={otpSent} />
            </div>
            {otpSent && (
              <div className="grid gap-2">
                <Label htmlFor="otp">One-Time Password (OTP)</Label>
                <Input id="otp" type="password" required value={otp} onChange={(e) => setOtp(e.target.value)} />
                 <p className="text-xs text-muted-foreground text-right">
                    Didn&apos;t receive OTP?{" "}
                    <button onClick={handleResendOtp} className="underline underline-offset-4 hover:text-primary">
                        Resend
                    </button>
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            {!otpSent ? (
               <Button onClick={handleSendOtp} className="w-full" disabled={isLoading || !phone} style={{backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))'}}>
                 {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                 Send OTP
               </Button>
            ) : (
                <Button onClick={handleLogin} className="w-full" disabled={isLoading || !otp} style={{backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))'}}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Login with OTP
                </Button>
            )}

             <p className="text-xs text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="underline underline-offset-4 hover:text-primary">
                    Register here
                </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
