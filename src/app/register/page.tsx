
"use client";

import { useState, useRef, useEffect } from 'react';
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
import { createUserWithEmailAndPassword, updateProfile, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useTranslation } from '@/context/translation-context';

// Helper function to compress the image before uploading
async function compressImage(file: File, options: { maxWidth: number; quality: number }): Promise<File> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = document.createElement('img');
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const scaleRatio = options.maxWidth / img.width;
                canvas.width = options.maxWidth;
                canvas.height = img.height * scaleRatio;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    return reject(new Error('Failed to get canvas context'));
                }
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            return reject(new Error('Canvas to Blob conversion failed'));
                        }
                        const compressedFile = new File([blob], file.name, {
                            type: file.type,
                            lastModified: Date.now(),
                        });
                        resolve(compressedFile);
                    },
                    file.type,
                    options.quality
                );
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
}


export default function RegisterPage() {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [pan, setPan] = useState('');
    const [aadhar, setAadhar] = useState('');
    const [location, setLocation] = useState('');
    const [profilePic, setProfilePic] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                router.push('/dashboard');
            } else {
                setIsCheckingAuth(false);
            }
        });
        return () => unsubscribe();
    }, [router]);


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
    
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
        setPhone(value.slice(0, 10));
    };

    const handlePanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.toUpperCase();
        setPan(value.slice(0, 10));
    };


    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        if (password.length < 6) {
            setError(t('register.passwordLengthError'));
            return;
        }
        if (phone.length !== 10) {
            setError("Please enter a valid 10-digit phone number.");
            return;
        }
        if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) {
            setError("Please enter a valid PAN number format (e.g., ABCDE1234F).");
            return;
        }
        if (aadhar.replace(/\s/g, '').length !== 12) {
            setError(t('register.aadharLengthError'));
            return;
        }
         if (!profilePic) {
            setError(t('register.profilePicError'));
            return;
        }

        setIsLoading(true);

        try {
            // 1. Create user in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. Compress profile picture
            const compressedProfilePic = await compressImage(profilePic, { maxWidth: 400, quality: 0.8 });

            // 3. Upload compressed profile picture to Firebase Storage
            let photoURL = '';
            if (compressedProfilePic) {
              const storageRef = ref(storage, `profilePictures/${user.uid}/${compressedProfilePic.name}`);
              const snapshot = await uploadBytes(storageRef, compressedProfilePic);
              photoURL = await getDownloadURL(snapshot.ref);
            }

            // 4. Update user profile in Firebase Auth
            await updateProfile(user, {
                displayName: name,
                photoURL: photoURL,
            });
            
            // 5. Create user document in Firestore
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                name: name,
                email: email,
                phone: phone,
                pan: pan,
                aadhar: aadhar.replace(/\s/g, ''), // Store unformatted
                location: location,
                photoURL: photoURL,
                createdAt: new Date().toISOString(),
            });

            toast({
                title: t('register.successTitle'),
                description: t('register.successDesc'),
            });

            // The onAuthStateChanged listener will handle the redirect.

        } catch (error: any) {
            console.error("Registration failed:", error);
            let errorMessage = t('register.unexpectedError');
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = t('register.emailInUseError');
            }
             else if (error.code) {
                errorMessage = error.message;
            }
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };
    
    if (isCheckingAuth) {
        return (
          <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        );
    }

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
                            <CardTitle>{t('register.createAccount')}</CardTitle>
                            <CardDescription>{t('register.joinCommunity')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {error && (
                                 <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>{t('register.errorTitle')}</AlertTitle>
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-2 text-left">
                                <Label>{t('register.profilePicture')}</Label>
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
                                                <p className="text-sm text-muted-foreground"><span className="font-semibold">{t('register.clickToUpload')}</span></p>
                                            </div>
                                        )}
                                        <Input ref={fileInputRef} id="profile-pic-input" type="file" className="hidden" onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" required />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-2 text-left">
                                <Label htmlFor="name">{t('register.fullName')}</Label>
                                <Input id="name" placeholder={t('register.namePlaceholder')} value={name} onChange={(e) => setName(e.target.value)} required />
                            </div>
                            <div className="space-y-2 text-left">
                                <Label htmlFor="email">{t('register.email')}</Label>
                                <Input id="email" type="email" placeholder="ramesh@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                            </div>
                             <div className="space-y-2 text-left">
                                <Label htmlFor="password">{t('register.password')}</Label>
                                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                            </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 text-left">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input id="phone" placeholder="9876543210" value={phone} onChange={handlePhoneChange} required />
                                </div>
                                <div className="space-y-2 text-left">
                                    <Label htmlFor="pan">PAN Number</Label>
                                    <Input id="pan" placeholder="ABCDE1234F" value={pan} onChange={handlePanChange} required />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 text-left">
                                    <Label htmlFor="aadhar">{t('register.aadhar')}</Label>
                                    <Input id="aadhar" placeholder="1234 5678 9012" value={aadhar} onChange={handleAadharChange} required />
                                </div>
                                <div className="space-y-2 text-left">
                                    <Label htmlFor="location">{t('register.location')}</Label>
                                    <Input id="location" placeholder="Pune, Maharashtra" value={location} onChange={(e) => setLocation(e.target.value)} required />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex-col gap-4">
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {isLoading ? t('register.registering') : t('register.register')}
                            </Button>
                            <div className="w-full text-center text-xs text-muted-foreground">
                                {t('register.haveAccount')}{" "}
                                <Link href="/" className="underline underline-offset-4 hover:text-primary">
                                    {t('register.loginHere')}
                                </Link>
                            </div>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}
