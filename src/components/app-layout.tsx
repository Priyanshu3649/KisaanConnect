
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Leaf,
  Tractor,
  Warehouse,
  Coins,
  BookOpenCheck,
  LifeBuoy,
  LucideIcon
} from "lucide-react";
import UserNav from "@/components/user-nav";
import BottomNav from "./bottom-nav";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/crop-diagnosis", icon: Leaf, label: "Crop Diagnosis" },
  { href: "/dashboard/mandi-prices", icon: Warehouse, label: "Mandi Prices" },
  { href: "/dashboard/equipment-rentals", icon: Tractor, label: "Equipment Rentals" },
  { href: "/dashboard/scheme-navigator", icon: Coins, label: "Scheme Navigator" },
  { href: "/dashboard/organics-support", icon: BookOpenCheck, label: "Organics Support" },
  { href: "/dashboard/help-feedback", icon: LifeBuoy, label: "Help & Feedback" },
];

const pageTitles: { [key: string]: string } = {
    "/dashboard": "Dashboard",
    "/dashboard/crop-diagnosis": "Crop Diagnosis",
    "/dashboard/mandi-prices": "Mandi Prices",
    "/dashboard/equipment-rentals": "Equipment Rentals",
    "/dashboard/scheme-navigator": "Scheme Navigator",
    "/dashboard/organics-support": "Organics Support",
    "/dashboard/help-feedback": "Help & Feedback"
};

const AppHeader = () => {
  const pathname = usePathname();
  const pageTitle = pageTitles[pathname] || "KisaanConnect";

  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b bg-background/95 backdrop-blur-sm px-4 lg:px-6 sticky top-0 z-30">
        <Link href="/dashboard" className="flex items-center gap-2 font-headline font-bold text-primary">
            <Leaf className="h-8 w-8" />
            <span className="text-2xl hidden sm:inline-block">KisaanConnect</span>
        </Link>
        <div className="flex-1 text-center hidden md:block">
            <h1 className="font-headline text-2xl font-bold tracking-tight">{pageTitle}</h1>
        </div>
        <UserNav />
    </header>
  );
};

export default function AppLayout({ children }: { children: React.ReactNode }) {

  return (
    <div className="flex min-h-screen w-full flex-col">
        <AppHeader />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-secondary/30 pb-20 md:pb-6">
            {children}
        </main>
        <BottomNav navItems={navItems} />
    </div>
  );
}
