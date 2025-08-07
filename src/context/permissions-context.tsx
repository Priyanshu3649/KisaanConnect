
'use client';

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from './translation-context';

interface PermissionsContextType {}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

const alerts = [
    { textKey: 'alerts.disease' },
    { textKey: 'alerts.rainfall' },
    { textKey: 'alerts.priceDrop' },
    { textKey: 'alerts.newScheme' }
];

export const PermissionsProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    const requestPermissions = async () => {
      // 1. Request Location Permission
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          () => {}, // Success: do nothing, we just needed to trigger the prompt
          (error) => {
            if (error.code === error.PERMISSION_DENIED) {
              console.warn('Location permission denied by user.');
            }
          }
        );
      }

      // 2. Request Notification Permission
      if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
      }

      // 3. If permission granted, send notifications
      if ('Notification' in window && Notification.permission === 'granted') {
         alerts.forEach((alert, index) => {
            setTimeout(() => {
                const notification = new Notification('KisaanConnect Alert', {
                    body: t(alert.textKey as any),
                    icon: '/logo.svg', // Assuming you have a logo in public
                });
            }, index * 2000); // Stagger notifications
         });
      }
    };

    // Use a timeout to allow the main app to render first
    const timer = setTimeout(() => {
      requestPermissions();
    }, 2000); // 2-second delay

    return () => clearTimeout(timer);
  }, [t]); // Depend on `t` so it re-runs if language changes, though this effect should ideally run once.

  return (
    <PermissionsContext.Provider value={{}}>
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = () => {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
};
