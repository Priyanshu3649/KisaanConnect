"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="font-body antialiased min-h-screen bg-background font-sans flex items-center justify-center">
        <Card className="w-full max-w-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="text-destructive" />
                    Something went wrong!
                </CardTitle>
                <CardDescription>
                    An unexpected error occurred. You can try to reload the page.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <details className="text-sm text-muted-foreground bg-secondary p-2 rounded-md">
                    <summary>Error Details</summary>
                    <pre className="mt-2 text-xs whitespace-pre-wrap">
                        {error.message}
                        {error.digest && `\nDigest: ${error.digest}`}
                    </pre>
                </details>
            </CardContent>
            <CardContent>
                 <Button onClick={() => reset()} className="w-full">
                    Try again
                </Button>
            </CardContent>
        </Card>
    </div>
  );
}
