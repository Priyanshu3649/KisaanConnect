
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Leaf, UploadCloud } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
    const router = useRouter();

    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();
        // Here you would typically handle the registration and Aadhaar auth flow.
        // For this prototype, we'll just navigate to the dashboard.
        router.push('/dashboard');
    }
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-background py-12">
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
              <Input id="phone" type="tel" placeholder="9876543210" required />
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
            <div className="grid gap-2 text-left">
              <Label htmlFor="aadhaar">Aadhaar Number</Label>
              <Input id="aadhaar" type="text" placeholder="XXXX XXXX XXXX" />
            </div>
            <div className="grid gap-2 text-left">
              <Label htmlFor="otp">Aadhaar OTP</Label>
              <Input id="otp" type="password" />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" style={{backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))'}}>
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
