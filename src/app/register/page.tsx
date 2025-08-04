
"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Leaf, UploadCloud, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { auth, db, storage } from '@/lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { doc, setDoc } from "firebase/firestore"; 
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: ConfirmationResult;
  }
}

export default function RegisterPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [location, setLocation] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [aadhaar, setAadhaar] = useState('');
    const [otp, setOtp] = useState('');
    const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const formRef = useRef<HTMLFormElement>(null);

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

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setProfilePhoto(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

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
        setIsLoading(true);
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
            setIsLoading(false);
        }
    }

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formRef.current?.checkValidity()) {
            formRef.current?.reportValidity();
            return;
        }
        setIsLoading(true);
        try {
            const confirmationResult = window.confirmationResult;
            if (!confirmationResult) {
                throw new Error("Please verify your phone number first.");
            }
            const userCredential = await confirmationResult.confirm(otp);
            const user = userCredential.user;

            let photoURL = '';
            if (profilePhoto) {
                const storageRef = ref(storage, `profile_photos/${user.uid}`);
                const snapshot = await uploadBytes(storageRef, profilePhoto);
                photoURL = await getDownloadURL(snapshot.ref);
            }

            // Save user data to Firestore
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                name: name,
                age: Number(age),
                location: location,
                phoneNumber: user.phoneNumber,
                email: email,
                aadhaar: aadhaar,
                photoURL: photoURL,
                createdAt: new Date(),
            });

            toast({
                title: "Registration Successful!",
                description: "Your account has been created.",
            });
            router.push('/dashboard');
        } catch (error: any) {
            console.error("Error during registration:", error);
            toast({
                variant: "destructive",
                title: "Registration Failed",
                description: "The OTP is incorrect or another error occurred.",
            });
        } finally {
            setIsLoading(false);
        }
    }
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-background py-12 p-4">
       <div id="recaptcha-container"></div>
       <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{backgroundImage: 'url(https://placehold.co/1920x1080.png)'}} data-ai-hint="farm landscape"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background z-0"></div>
      <div className="relative z-10 flex w-full flex-col items-center space-y-4 text-center">
        <div className="flex items-center space-x-2 text-primary">
          <Leaf className="h-12 w-12" />
          <h1 className="font-headline text-5xl font-bold">KisaanConnect</h1>
        </div>
        <p className="text-muted-foreground text-lg">Join our community of empowered farmers.</p>
        <Card className="w-full max-w-lg bg-card/80 backdrop-blur-sm border-border/50">
         <form onSubmit={handleRegister} ref={formRef}>
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Create an Account</CardTitle>
            <CardDescription>Fill in your details below to get started.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2 text-left">
              <Label htmlFor="name">Full Name <span className="text-destructive">*</span></Label>
              <Input id="name" type="text" placeholder="Your full name" required value={name} onChange={e => setName(e.target.value)} />
            </div>
             <div className="grid gap-2 text-left">
              <Label htmlFor="age">Age <span className="text-destructive">*</span></Label>
              <Input id="age" type="number" placeholder="Your age" required value={age} onChange={e => setAge(e.target.value)} />
            </div>
             <div className="grid gap-2 text-left md:col-span-2">
              <Label htmlFor="location">Location <span className="text-destructive">*</span></Label>
              <Input id="location" type="text" placeholder="Village, District, State" required value={location} onChange={e => setLocation(e.target.value)} />
            </div>
             <div className="grid gap-2 text-left">
              <Label htmlFor="phone">Phone Number <span className="text-destructive">*</span></Label>
              <Input id="phone" type="tel" placeholder="9876543210" required value={phone} onChange={e => setPhone(e.target.value)} disabled={isOtpSent} />
            </div>
            <div className="grid gap-2 text-left">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" placeholder="name@example.com" value={email} onChange={e => setEmail(e.target.value)}/>
            </div>
            <div className="grid gap-2 text-left md:col-span-2">
                <Label htmlFor="profile-photo">Profile Photo</Label>
                 <label htmlFor="profile-photo-input" className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-secondary">
                    {photoPreview ? (
                         <img src={photoPreview} alt="Profile preview" className="h-full w-auto object-contain p-1 rounded-lg" />
                    ) : (
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span></p>
                        </div>
                    )}
                    <Input id="profile-photo-input" type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
                 </label>
            </div>
            <div className="grid gap-2 text-left md:col-span-2">
              <Label htmlFor="aadhaar">Aadhaar Number (Optional)</Label>
              <Input id="aadhaar" type="text" placeholder="XXXX XXXX XXXX" value={aadhaar} onChange={(e) => setAadhaar(e.target.value)} />
            </div>
            
            {!isOtpSent ? (
              <div className="md:col-span-2">
                <Button onClick={handleGenerateOtp} disabled={!phone || isLoading} className="w-full">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Generate OTP
                </Button>
              </div>
            ) : (
                <div className="grid gap-2 text-left md:col-span-2">
                    <Label htmlFor="otp">Verify Phone with OTP <span className="text-destructive">*</span></Label>
                    <Input id="otp" type="password" placeholder="Enter 6-digit OTP" value={otp} onChange={e => setOtp(e.target.value)} required />
                </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" style={{backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))'}} disabled={!isOtpSent || !otp || isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
