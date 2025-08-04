"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Leaf,
  Tractor,
  Warehouse,
  Coins,
  BookOpenCheck,
} from "lucide-react";
import UserNav from "@/components/user-nav";
import { cn } from "@/lib/utils";
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
  const pageTitle = pageTitles[pathname] || "Dashboard";

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur-sm px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30">
        <div className="w-full flex-1">
            <h1 className="font-headline text-xl font-semibold">{pageTitle}</h1>
        </div>
        <UserNav />
    </header>
  );
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <div className="grid min-h-screen w-full md:grid-cols-[5rem_1fr]">
        <Sidebar className="hidden md:flex md:flex-col" collapsible="none">
          <SidebarHeader>
            <Link href="/dashboard" className="flex items-center justify-center h-16">
              <Leaf className="h-8 w-8 text-primary" />
              <span className="sr-only">KisaanConnect</span>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href} className="flex justify-center">
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.label}
                    className={cn(
                      "rounded-full !w-12 !h-12 flex items-center justify-center transition-colors duration-200",
                      pathname === item.href && "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-5 w-5" />
                      <span className="sr-only">{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>

        <div className="flex flex-col">
          <AppHeader />
          <SidebarInset className="bg-background pb-16 md:pb-0">
            <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                {children}
            </main>
          </SidebarInset>
        </div>
        
        <BottomNav navItems={navItems} />
      </div>
    </SidebarProvider>
  );
}
