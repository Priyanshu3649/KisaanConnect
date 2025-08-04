"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Leaf, UploadCloud, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image';
import { auth, db, storage } from '@/lib/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [aadhar, setAadhar] = useState('');
    const [location, setLocation] = useState('');
    const [profilePic, setProfilePic] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setProfilePic(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAadharChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
        const formattedValue = value.slice(0, 12).replace(/(\d{4})(?=\d)/g, '$1 ');
        setAadhar(formattedValue);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        if (password.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }
        if (aadhar.replace(/\s/g, '').length !== 12) {
            setError("Please enter a valid 12-digit Aadhar number.");
            return;
        }
         if (!profilePic) {
            setError("Please upload a profile picture.");
            return;
        }

        setIsLoading(true);

        try {
            // 1. Create user in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. Upload profile picture to Firebase Storage
            const storageRef = ref(storage, `profilePictures/${user.uid}/${profilePic.name}`);
            const snapshot = await uploadBytes(storageRef, profilePic);
            const photoURL = await getDownloadURL(snapshot.ref);

            // 3. Update user profile in Firebase Auth
            await updateProfile(user, {
                displayName: name,
                photoURL: photoURL,
            });
            
            // 4. Create user document in Firestore
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                name: name,
                email: email,
                aadhar: aadhar,
                location: location,
                photoURL: photoURL,
                createdAt: new Date(),
            });

            toast({
                title: "Registration Successful!",
                description: "Your account has been created. Redirecting to dashboard...",
            });

            router.push('/dashboard');

        } catch (error: any) {
            console.error("Registration failed:", error);
            let errorMessage = "An unexpected error occurred. Please try again.";
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = "This email address is already in use by another account.";
            }
             else if (error.code) {
                errorMessage = error.message;
            }
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
         <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
            <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{backgroundImage: 'url(https://placehold.co/1920x1080.png)'}} data-ai-hint="farm landscape"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background z-0"></div>
            <div className="relative z-10 flex w-full max-w-md flex-col items-center space-y-4 text-center">
                <Link href="/" className="flex items-center space-x-2 text-primary mb-4">
                    <Leaf className="h-10 w-10" />
                    <h1 className="font-headline text-4xl font-bold">KisaanConnect</h1>
                </Link>

                <Card className="w-full bg-card/80 backdrop-blur-sm border-border/50">
                    <form onSubmit={handleSubmit}>
                        <CardHeader>
                            <CardTitle>Create an Account</CardTitle>
                            <CardDescription>Join our community of modern farmers.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {error && (
                                 <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Registration Error</AlertTitle>
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-2 text-left">
                                <Label>Profile Picture</Label>
                                <div 
                                    className="flex items-center justify-center w-full"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-secondary">
                                        {previewUrl ? (
                                            <Image src={previewUrl} alt="Profile preview" width={100} height={100} className="h-28 w-28 rounded-full object-cover p-1" />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
                                                <p className="text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span></p>
                                            </div>
                                        )}
                                        <Input ref={fileInputRef} id="profile-pic-input" type="file" className="hidden" onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" required />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-2 text-left">
                                <Label htmlFor="name">Full Name</Label>
                                <Input id="name" placeholder="Ramesh Kumar" value={name} onChange={(e) => setName(e.target.value)} required />
                            </div>
                            <div className="space-y-2 text-left">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" placeholder="ramesh@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                            </div>
                             <div className="space-y-2 text-left">
                                <Label htmlFor="password">Password</Label>
                                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 text-left">
                                    <Label htmlFor="aadhar">Aadhaar Number</Label>
                                    <Input id="aadhar" placeholder="1234 5678 9012" value={aadhar} onChange={handleAadharChange} required />
                                </div>
                                <div className="space-y-2 text-left">
                                    <Label htmlFor="location">Village/Town, State</Label>
                                    <Input id="location" placeholder="Pune, Maharashtra" value={location} onChange={(e) => setLocation(e.target.value)} required />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex-col gap-4">
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {isLoading ? "Registering..." : "Register"}
                            </Button>
                            <div className="w-full text-center text-xs text-muted-foreground">
                                Already have an account?{" "}
                                <Link href="/" className="underline underline-offset-4 hover:text-primary">
                                    Login here
                                </Link>
                            </div>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}