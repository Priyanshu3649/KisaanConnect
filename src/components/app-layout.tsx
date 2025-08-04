
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
} from "lucide-react";
import UserNav from "@/components/user-nav";
import BottomNav from "./bottom-nav";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/crop-diagnosis", icon: Leaf, label: "Crop Diagnosis" },
  { href: "/dashboard/mandi-prices", icon: Warehouse, label: "Mandi Prices" },
  { href: "/dashboard/equipment-rentals", icon: Tractor, label: "Equipment Rentals" },
  { href: "/dashboard/scheme-navigator", icon: Coins, label: "Scheme Navigator" },
  { href: "/dashboard/organics-support", icon: BookOpenCheck, label: "Organics Support" },
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
    <header className="flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur-sm px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30">
        <Link href="/dashboard" className="flex items-center gap-2 font-headline font-bold text-primary md:hidden">
            <Leaf className="h-6 w-6" />
            <span className="text-lg">KisaanConnect</span>
        </Link>
        <div className="w-full flex-1 md:text-center">
            <h1 className="font-headline text-xl font-semibold hidden md:block">{pageTitle}</h1>
        </div>
        <UserNav />
    </header>
  );
};

const DesktopSidebar = () => {
    const pathname = usePathname();
    return (
        <aside className="hidden md:flex md:flex-col w-20 border-r bg-background">
            <Link href="/dashboard" className="flex items-center justify-center h-16">
              <Leaf className="h-8 w-8 text-primary" />
              <span className="sr-only">KisaanConnect</span>
            </Link>
            <nav className="flex flex-col items-center gap-4 px-2 mt-4">
                 {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex h-12 w-12 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground ${pathname === item.href ? 'bg-primary text-primary-foreground' : ''}`}
                    >
                        <item.icon className="h-5 w-5" />
                        <span className="sr-only">{item.label}</span>
                    </Link>
                ))}
            </nav>
        </aside>
    )
}


export default function AppLayout({ children }: { children: React.ReactNode }) {

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[80px_1fr]">
        <DesktopSidebar />
        <div className="flex flex-col">
          <AppHeader />
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-secondary/30">
              {children}
          </main>
        </div>
        <BottomNav navItems={navItems} />
    </div>
  );
}
