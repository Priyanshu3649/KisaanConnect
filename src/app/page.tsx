import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Leaf } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-background">
       <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{backgroundImage: 'url(https://placehold.co/1920x1080.png)'}} data-ai-hint="farm landscape"></div>
      <div className="relative z-10 flex flex-col items-center space-y-4">
        <div className="flex items-center space-x-2 text-primary">
          <Leaf className="h-12 w-12" />
          <h1 className="font-headline text-5xl font-bold">KisaanConnect</h1>
        </div>
        <p className="text-muted-foreground text-lg">Empowering Indian farmers through technology.</p>
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Secure Login</CardTitle>
            <CardDescription>Enter your Aadhaar details to continue.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="aadhaar">Aadhaar Number</Label>
              <Input id="aadhaar" type="text" placeholder="XXXX XXXX XXXX" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="otp">One-Time Password (OTP)</Label>
              <Input id="otp" type="password" required />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" asChild style={{backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))'}}>
              <Link href="/dashboard">Login with OTP</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
