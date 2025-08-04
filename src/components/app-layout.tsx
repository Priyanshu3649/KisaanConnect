
"use client";

import React from "react";
import AppHeader from "@/components/app-header";
import BottomNav from "@/components/bottom-nav";
import VoiceNavigator from "./voice-navigator";
import { useIsMobile } from "@/hooks/use-mobile";
import type * as LucideIcons from "lucide-react";

export interface NavItem {
  href: string;
  icon: keyof typeof LucideIcons;
  labelKey: string;
}

const navItems: NavItem[] = [
  { href: "/dashboard", icon: "User", labelKey: "nav.profile" },
  { href: "/dashboard/crop-diagnosis", icon: "Leaf", labelKey: "nav.cropDiagnosis" },
  { href: "/dashboard/mandi-prices", icon: "Warehouse", labelKey: "nav.mandiPrices" },
  { href: "/dashboard/equipment-rentals", icon: "Tractor", labelKey: "nav.equipmentRentals" },
  { href: "/dashboard/scheme-navigator", icon: "Sparkles", labelKey: "nav.schemeNavigator" },
  { href: "/dashboard/organics-support", icon: "Sprout", labelKey: "nav.organicsSupport" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  
  const allNavItems: NavItem[] = [
      ...navItems,
      { href: "/dashboard/help-feedback", icon: "LifeBuoy", labelKey: "nav.helpAndFeedback" },
  ];
  
  // For the mobile bottom nav, we typically show fewer items.
  // We'll show the main 6 here. Help/Feedback can be in the user menu.
  const mobileNavItems = navItems;

  return (
    <div className="flex flex-col min-h-screen w-full bg-background">
      <AppHeader navItems={allNavItems} />
      <main className="flex-grow p-4 md:p-6 pb-20 md:pb-6">
        {children}
      </main>
      {isMobile && <BottomNav navItems={mobileNavItems} />}
      <VoiceNavigator />
    </div>
  );
}
