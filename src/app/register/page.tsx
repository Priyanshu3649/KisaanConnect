
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Leaf } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
    const router = useRouter();

    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();
        // Here you would typically handle the Aadhaar authentication flow.
        // For this prototype, we'll just navigate to the dashboard.
        router.push('/dashboard');
    }
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-background">
       <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{backgroundImage: 'url(https://placehold.co/1920x1080.png)'}} data-ai-hint="farm landscape"></div>
      <div className="relative z-10 flex flex-col items-center space-y-4 text-center">
        <div className="flex items-center space-x-2 text-primary">
          <Leaf className="h-12 w-12" />
          <h1 className="font-headline text-5xl font-bold">KisaanConnect</h1>
        </div>
        <p className="text-muted-foreground text-lg">Join our community of empowered farmers.</p>
        <Card className="w-full max-w-sm">
         <form onSubmit={handleRegister}>
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Create an Account</CardTitle>
            <CardDescription>Verify your identity with Aadhaar to register.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="aadhaar">Aadhaar Number</Label>
              <Input id="aadhaar" type="text" placeholder="XXXX XXXX XXXX" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="otp">Aadhaar OTP</Label>
              <Input id="otp" type="password" required />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" style={{backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))'}}>
              Register with Aadhaar
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
