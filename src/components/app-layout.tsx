
"use client";

import React from "react";
import AppHeader from "@/components/app-header";
import BottomNav from "@/components/bottom-nav";
import VoiceNavigator from "./voice-navigator";
import { useIsMobile } from "@/hooks/use-mobile";

const navItems = [
  { href: "/dashboard", icon: "User", labelKey: "nav.profile" },
  { href: "/dashboard/crop-diagnosis", icon: "Leaf", labelKey: "nav.cropDiagnosis" },
  { href: "/dashboard/mandi-prices", icon: "Warehouse", labelKey: "nav.mandiPrices" },
  { href: "/dashboard/equipment-rentals", icon: "Tractor", labelKey: "nav.equipmentRentals" },
  { href: "/dashboard/scheme-navigator", icon: "Sparkles", labelKey: "nav.schemeNavigator" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col min-h-screen w-full bg-background">
      <AppHeader />
      <main className="flex-grow p-4 md:p-6 mb-16 md:mb-0">
        {children}
      </main>
      {isMobile && <BottomNav navItems={navItems} />}
      <VoiceNavigator />
    </div>
  );
}
