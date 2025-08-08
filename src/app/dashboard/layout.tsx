
"use client";

import { useEffect } from "react";
import { AudioPlayerProvider } from "@/context/audio-player-context";
import AppLayout from "@/components/app-layout";
import { useTranslation } from "@/context/translation-context";
import type { Translations } from "@/context/translation-context";

const alerts = [
    { textKey: 'alerts.disease' },
    { textKey: 'alerts.rainfall' },
    { textKey: 'alerts.priceDrop' },
    { textKey: 'alerts.newScheme' }
];

// Helper function to show notifications, accepting `t` as an argument.
const showNotifications = (t: (key: keyof Translations, options?: { [key: string]: string | number }) => string) => {
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
};

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
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }
        
        return false;
    };
    
    const timer = setTimeout(async () => {
       const hasPermission = await requestNotificationPermission();
       if(hasPermission) {
            // Pass the stable `t` function directly to the helper.
            showNotifications(t);
       }
    }, 3000); // Request after 3 seconds

    return () => clearTimeout(timer);
    
    // The `t` function can be an unstable dependency. By calling it inside the timeout
    // and passing it to a helper, we avoid re-triggering the effect unnecessarily.
  }, [t]);


  return (
    <AudioPlayerProvider>
        <AppLayout>
            {children}
        </AppLayout>
    </AudioPlayerProvider>
  );
}
