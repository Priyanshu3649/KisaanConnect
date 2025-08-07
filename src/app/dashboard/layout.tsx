
import { AudioPlayerProvider } from "@/context/audio-player-context";
import AppLayout from "@/components/app-layout";
import { PermissionsProvider } from "@/context/permissions-context";


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  
  return (
    <AudioPlayerProvider>
      <PermissionsProvider>
        <AppLayout>
            {children}
        </AppLayout>
      </PermissionsProvider>
    </AudioPlayerProvider>
  );
}
