
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Leaf } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSendOtp = (e: React.MouseEvent<HTMLButtonElement>) => {
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
    // Simulate sending OTP
    setTimeout(() => {
        setOtpSent(true);
        setIsLoading(false);
        toast({
            title: "OTP Sent",
            description: "An OTP has been sent to your phone number.",
        });
    }, 1000);
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-background">
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
                <Button className="w-full" asChild style={{backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))'}}>
                  <Link href="/dashboard">Login with OTP</Link>
                </Button>
            )}

             <p className="text-xs text-muted-foreground">
                Don't have an account?{" "}
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
