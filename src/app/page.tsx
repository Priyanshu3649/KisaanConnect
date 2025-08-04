
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Leaf } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { auth } from '@/lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { useTranslation } from '@/context/translation-context';

// Extend window type to include recaptchaVerifier
declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: ConfirmationResult;
  }
}

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);


export default function LoginPage() {
  const { t } = useTranslation();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push('/dashboard');
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            size: 'invisible',
            callback: () => {
              // reCAPTCHA solved
            },
            'expired-callback': () => {
              // Response expired. Ask user to solve reCAPTCHA again.
            }
        });
        window.recaptchaVerifier.render().catch(err => console.error("Recaptcha render error", err));
    }
  }, []);

  const handleSendOtp = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(phone)) {
      toast({
        variant: "destructive",
        title: t('login.invalidPhoneTitle'),
        description: t('login.invalidPhoneDesc'),
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
        title: t('login.otpSentTitle'),
        description: t('login.otpSentDesc'),
      });
    } catch (error: any) {
      console.error("Error sending OTP:", error);
      toast({
        variant: "destructive",
        title: t('login.otpFailedTitle'),
        description: error.message || t('login.otpFailedDesc'),
      });
       // Reset reCAPTCHA on error
       // @ts-ignore
      if (window.grecaptcha && window.recaptchaVerifier) {
        // @ts-ignore
        window.grecaptcha.reset(window.recaptchaVerifier.widgetId);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = () => {
     handleSendOtp(new MouseEvent('click') as any);
     toast({
        title: t('login.otpResentTitle'),
        description: t('login.otpResentDesc'),
    });
  }

  const handlePhoneLogin = async () => {
    setIsVerifying(true);
    try {
      const confirmationResult = window.confirmationResult;
      if (!confirmationResult) {
          throw new Error(t('login.noConfirmationError'));
      }
      await confirmationResult.confirm(otp);
      toast({
        title: t('login.loginSuccessTitle'),
        description: t('login.welcomeBack'),
      });
      router.push('/dashboard');
    } catch (error: any) {
      console.error("Error verifying OTP:", error);
       toast({
        variant: "destructive",
        title: t('login.loginFailedTitle'),
        description: t('login.otpIncorrectError'),
      });
    } finally {
      setIsVerifying(false);
    }
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: t('login.loginSuccessTitle'),
        description: t('login.welcomeBack'),
      });
      router.push('/dashboard');
    } catch (error: any) {
      console.error("Error logging in with email:", error);
      toast({
        variant: "destructive",
        title: t('login.loginFailedTitle'),
        description: (error as any).code === 'auth/invalid-credential' ? t('login.invalidCredentials') : t('login.unexpectedError'),
      });
    } finally {
        setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({
        title: t('login.loginSuccessTitle'),
        description: t('login.welcomeBack'),
      });
      router.push('/dashboard');
    } catch (error: any) {
      console.error("Error with Google sign-in:", error);
      toast({
        variant: "destructive",
        title: t('login.googleLoginFailedTitle'),
        description: t('login.googleLoginFailedDesc'),
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
      <div id="recaptcha-container"></div>
       <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{backgroundImage: 'url(https://placehold.co/1920x1080.png)'}} data-ai-hint="farm landscape"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background z-0"></div>
      <div className="relative z-10 flex flex-col items-center space-y-4 text-center">
        <div className="flex items-center space-x-2 text-primary">
          <Leaf className="h-12 w-12" />
          <h1 className="font-headline text-5xl font-bold">KisaanConnect</h1>
        </div>
        <p className="text-muted-foreground text-lg">{t('login.tagline')}</p>
        <Card className="w-full max-w-sm bg-card/80 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle>{t('login.welcome')}</CardTitle>
            <CardDescription>{t('login.chooseMethod')}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
             <Tabs defaultValue="phone" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="phone">{t('login.phone')}</TabsTrigger>
                <TabsTrigger value="email">{t('login.email')}</TabsTrigger>
              </TabsList>
              <TabsContent value="phone" className="space-y-4 pt-4">
                <div className="grid gap-2">
                  <Label htmlFor="phone">{t('login.phoneNumber')}</Label>
                  <Input id="phone" type="tel" placeholder="9876543210" required value={phone} onChange={(e) => setPhone(e.target.value)} disabled={otpSent} />
                </div>
                {otpSent && (
                  <div className="grid gap-2">
                    <Label htmlFor="otp">{t('login.otp')}</Label>
                    <Input id="otp" type="password" required value={otp} onChange={(e) => setOtp(e.target.value)} />
                    <div className="text-xs text-muted-foreground text-right">
                        {t('login.noOtp')}{" "}
                        <button onClick={handleResendOtp} className="underline underline-offset-4 hover:text-primary">
                            {t('login.resend')}
                        </button>
                    </div>
                  </div>
                )}
                 {!otpSent ? (
                    <Button onClick={handleSendOtp} className="w-full" disabled={isLoading || !phone}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {t('login.sendOtp')}
                    </Button>
                ) : (
                    <Button onClick={handlePhoneLogin} className="w-full" disabled={isVerifying || !otp}>
                      {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {t('login.loginWithOtp')}
                    </Button>
                )}
              </TabsContent>
              <TabsContent value="email" className="space-y-4 pt-4">
                <form onSubmit={handleEmailLogin} className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="email">{t('login.emailAddress')}</Label>
                        <Input id="email" type="email" placeholder="name@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password">{t('login.password')}</Label>
                        <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading || !email || !password}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('login.loginWithEmail')}
                    </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  {t('login.orContinueWith')}
                </span>
              </div>
            </div>

            <Button variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon className="mr-2 h-4 w-4" />}
                Google
            </Button>
          </CardContent>
          <CardFooter>
             <div className="w-full text-center text-xs text-muted-foreground">
                {t('login.noAccount')}{" "}
                <Link href="/register" className="underline underline-offset-4 hover:text-primary">
                    {t('login.registerHere')}
                </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
