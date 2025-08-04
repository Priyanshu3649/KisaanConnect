
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex h-full flex-1 w-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading Page...</p>
      </div>
    </div>
  );
}
