
"use client";

import { useEffect } from "react";
import { AudioPlayerProvider } from "@/context/audio-player-context";
import AppLayout from "@/components/app-layout";
import { useTranslation } from "@/context/translation-context";

const alerts = [
    { textKey: 'alerts.disease' },
    { textKey: 'alerts.rainfall' },
    { textKey: 'alerts.priceDrop' },
    { textKey: 'alerts.newScheme' }
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  
  useEffect(() => {
    const requestNotificationPermission = async () => {
        if (!('Notification' in window)) {
            console.log("This browser does not support desktop notification");
            return;
        }

        if (Notification.permission === 'default') {
            await Notification.requestPermission();
        }

        if (Notification.permission === 'granted') {
            // Check if we've shown notifications before
            const hasShownNotifications = localStorage.getItem('hasShownNotifications');
            if (!hasShownNotifications) {
                alerts.forEach((alert, index) => {
                    setTimeout(() => {
                        new Notification('KisaanConnect Alert', {
                            body: t(alert.textKey as any),
                            icon: '/logo.svg',
                        });
                    }, index * 2500); // Stagger notifications
                });
                localStorage.setItem('hasShownNotifications', 'true');
            }
        }
    };
    
    // Request permission after a short delay
    const timer = setTimeout(requestNotificationPermission, 3000);
    return () => clearTimeout(timer);

  }, [t]);


  return (
    <AudioPlayerProvider>
        <AppLayout>
            {children}
        </AppLayout>
    </AudioPlayerProvider>
  );
}
