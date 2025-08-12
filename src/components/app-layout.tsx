
"use client";

import React from "react";
import AppHeader from "@/components/app-header";
import BottomNav from "@/components/bottom-nav";
import VoiceAssistant from "./voice-assistant";
import { useIsMobile } from "@/hooks/use-mobile";
import type * as LucideIcons from "lucide-react";
import Sidebar from "./sidebar";
import { AudioPlayerProvider } from "@/context/audio-player-context";

export interface NavItem {
  href: string;
  icon: keyof typeof LucideIcons;
  labelKey: string;
}

const navItems: NavItem[] = [
  { href: "/dashboard", icon: "LayoutDashboard", labelKey: "nav.dashboard" },
  { href: "/dashboard/digital-twin", icon: "Map", labelKey: "nav.digitalTwin" },
  { href: "/dashboard/weather", icon: "CloudSun", labelKey: "nav.weather" },
  { href: "/dashboard/mandi-prices", icon: "Warehouse", labelKey: "nav.mandiPrices" },
  { href: "/dashboard/sales-advisor", icon: "TrendingUp", labelKey: "nav.salesAdvisor" },
  { href: "/dashboard/inventory", icon: "Archive", labelKey: "nav.inventory" },
  { href: "/dashboard/equipment-rentals", icon: "Tractor", labelKey: "nav.equipmentRentals" },
  { href: "/dashboard/government-schemes", icon: "Landmark", labelKey: "nav.governmentSchemes" },
  { href: "/dashboard/organics-support", icon: "Sprout", labelKey: "nav.organicsSupport" },
  { href: "/dashboard/ai-assistant", icon: "Bot", labelKey: "nav.aiAssistant" },
  { href: "/dashboard/customer-support", icon: "Phone", labelKey: "nav.customerSupport" },
  { href: "/dashboard/manage-account", icon: "User", labelKey: "nav.manageAccount" },
];

// For mobile, we have a different set for the bottom nav
const mobileNavItems: NavItem[] = [
    { href: "/dashboard", icon: "UserRound", labelKey: "nav.profile" },
    { href: "/dashboard/mandi-prices", icon: "Warehouse", labelKey: "nav.mandiPrices" },
    { href: "/dashboard/sales-advisor", icon: "TrendingUp", labelKey: "nav.salesAdvisor" },
    { href: "/dashboard/equipment-rentals", icon: "Tractor", labelKey: "nav.equipmentRentals" },
    { href: "/dashboard/help-feedback", icon: "HelpCircle", labelKey: "nav.helpAndFeedback" }
];


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  
  return (
    <AudioPlayerProvider>
     <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <Sidebar navItems={navItems} />
      <div className="flex flex-col max-h-screen overflow-hidden">
        <AppHeader navItems={navItems} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
            {children}
        </main>
        {isMobile && <BottomNav navItems={mobileNavItems} />}
        <VoiceAssistant />
      </div>
    </div>
    </AudioPlayerProvider>
  );
}
