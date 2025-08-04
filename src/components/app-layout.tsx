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
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Leaf,
  Tractor,
  Warehouse,
  Coins,
  BookOpenCheck,
  LifeBuoy,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import UserNav from "@/components/user-nav";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/crop-diagnosis", icon: Leaf, label: "Crop Diagnosis" },
  { href: "/dashboard/mandi-prices", icon: Warehouse, label: "Mandi Prices" },
  { href: "/dashboard/equipment-rentals", icon: Tractor, label: "Equipment Rentals" },
  { href: "/dashboard/scheme-navigator", icon: Coins, label: "Scheme Navigator" },
  { href: "/dashboard/organics-support", icon: BookOpenCheck, label: "Organics Support" },
];

const AppHeader = () => {
  const { isMobile, toggleSidebar } = useSidebar();

  const getPageTitle = (path: string) => {
    const item = navItems.find((item) => item.href === path);
    return item ? item.label : "Dashboard";
  };
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30">
        {isMobile && (
          <Button variant="outline" size="icon" className="shrink-0" onClick={toggleSidebar}>
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        )}
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
      <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <Sidebar className="hidden md:block" collapsible="icon">
          <SidebarHeader>
            <div className="flex items-center gap-2 p-2">
              <Leaf className="h-8 w-8 text-primary" />
              <span className="font-headline text-2xl font-bold group-data-[collapsible=icon]:hidden">KisaanConnect</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href} legacyBehavior passHref>
                    <SidebarMenuButton
                      isActive={pathname === item.href}
                      tooltip={item.label}
                      className={cn(pathname === item.href && "bg-sidebar-accent text-sidebar-accent-foreground")}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>

        <div className="flex flex-col">
          <AppHeader />
          <SidebarInset className="bg-background">
            <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                {children}
            </main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
