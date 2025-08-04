"use client";

import Sidebar from "@/components/sidebar";
import AppHeader from "@/components/app-header";
import MobileHeader from "./mobile-header";
import VoiceNavigator from "./voice-navigator";
import { useIsMobile } from "@/hooks/use-mobile";

const navItems = [
  { href: "/dashboard", icon: "User", labelKey: "nav.profile" },
  { href: "/dashboard/crop-diagnosis", icon: "Leaf", labelKey: "nav.cropDiagnosis" },
  { href: "/dashboard/mandi-prices", icon: "Warehouse", labelKey: "nav.mandiPrices" },
  { href: "/dashboard/equipment-rentals", icon: "Tractor", labelKey: "nav.equipmentRentals" },
  { href: "/dashboard/scheme-navigator", icon: "Coins", labelKey: "nav.schemeNavigator" },
  { href: "/dashboard/organics-support", icon: "BookOpenCheck", labelKey: "nav.organicsSupport" },
  { href: "/dashboard/help-feedback", icon: "LifeBuoy", labelKey: "nav.helpAndFeedback" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen w-full bg-background">
      {isMobile ? (
        <>
          <MobileHeader navItems={navItems} />
          <main className="p-4 bg-secondary/30 min-h-screen">{children}</main>
        </>
      ) : (
        <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
          <Sidebar navItems={navItems} />
          <div className="flex flex-col">
            <AppHeader />
            <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-secondary/30">
              {children}
            </main>
          </div>
        </div>
      )}
      <VoiceNavigator />
    </div>
  );
}
