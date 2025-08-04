
"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Leaf,
  Tractor,
  Warehouse,
  Coins,
  BookOpenCheck,
  LifeBuoy,
  LucideIcon,
  Mic,
  Languages,
  Loader2,
} from "lucide-react";
import UserNav from "@/components/user-nav";
import BottomNav from "./bottom-nav";
import { useTranslation } from "@/context/translation-context";
import VoiceNavigator from "./voice-navigator";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, labelKey: "dashboard" },
  { href: "/dashboard/crop-diagnosis", icon: Leaf, labelKey: "cropDiagnosis" },
  { href: "/dashboard/mandi-prices", icon: Warehouse, labelKey: "mandiPrices" },
  { href: "/dashboard/equipment-rentals", icon: Tractor, labelKey: "equipmentRentals" },
  { href: "/dashboard/scheme-navigator", icon: Coins, labelKey: "schemeNavigator" },
  { href: "/dashboard/organics-support", icon: BookOpenCheck, labelKey: "organicsSupport" },
  { href: "/dashboard/help-feedback", icon: LifeBuoy, labelKey: "helpAndFeedback" },
];


const AppHeader = () => {
  const { t, setLanguage, language } = useTranslation();
  const pathname = usePathname();
  const currentNavItem = navItems.find(item => item.href === pathname);
  const pageTitle = currentNavItem ? t(`nav.${currentNavItem.labelKey}`) : "KisaanConnect";

  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b bg-background/95 backdrop-blur-sm px-4 lg:px-6 sticky top-0 z-30">
        <Link href="/dashboard" className="flex items-center gap-2 font-headline font-bold text-primary">
            <Leaf className="h-8 w-8" />
            <span className="text-2xl hidden sm:inline-block">KisaanConnect</span>
        </Link>
        <div className="flex-1 text-center hidden md:block">
            <h1 className="font-headline text-2xl font-bold tracking-tight">{pageTitle}</h1>
        </div>
        <div className="flex items-center gap-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Languages className="h-5 w-5" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setLanguage('en')} disabled={language === 'en'}>
                        English
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLanguage('hi')} disabled={language === 'hi'}>
                        हिंदी
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <UserNav />
        </div>
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
        <VoiceNavigator />
    </div>
  );
}
