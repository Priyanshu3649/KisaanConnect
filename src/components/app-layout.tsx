
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
  { href: "/dashboard/help-feedback", icon: "LifeBuoy", labelKey: "nav.helpAndFeedback" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  
  // Filter items for bottom nav (e.g., exclude help/feedback if needed, or limit to 6)
  const bottomNavItems = navItems.filter(item => item.href !== '/dashboard/help-feedback');


  return (
    <div className="flex flex-col min-h-screen w-full bg-background">
      <AppHeader navItems={navItems} />
      <main className="flex-grow p-4 md:p-6 mb-16 md:mb-0">
        {children}
      </main>
      {isMobile && <BottomNav navItems={bottomNavItems} />}
      <VoiceNavigator />
    </div>
  );
}
