
"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Languages, Leaf, Menu } from "lucide-react";
import { useTranslation } from "@/context/translation-context";
import UserNav from "./user-nav";
import AlertMenu from "./alert-menu";
import Link from "next/link";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePathname } from "next/navigation";
import type { NavItem } from "./app-layout";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { cn } from "@/lib/utils";

interface AppHeaderProps {
    navItems: NavItem[];
}

export default function AppHeader({ navItems }: AppHeaderProps) {
  const { setLanguage, language, t } = useTranslation();
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const currentPage = navItems.find(item => item.href === pathname);

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-primary/20 bg-primary text-primary-foreground px-4 md:px-6">
        <div className="flex items-center gap-2 md:hidden">
         <Sheet>
            <SheetTrigger asChild>
                <Button
                variant="outline"
                size="icon"
                className="shrink-0 text-primary-foreground border-primary-foreground/50 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left">
                <nav className="grid gap-6 text-lg font-medium">
                <Link
                    href="/dashboard"
                    className="flex items-center gap-2 text-lg font-semibold text-primary"
                >
                    <Leaf className="h-6 w-6" />
                    <span className="sr-only">KisaanConnect</span>
                </Link>
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn("hover:text-foreground", pathname === item.href ? "text-foreground" : "text-muted-foreground")}
                    >
                        {t(item.labelKey as any)}
                    </Link>
                ))}
                </nav>
            </SheetContent>
            </Sheet>
        </div>
        
        <div className="flex-1 text-center md:text-left">
            <h1 className="font-semibold text-xl tracking-tight hidden md:block">
              {currentPage ? t(currentPage.labelKey as any) : "Dashboard"}
            </h1>
        </div>
        

        <div className="flex-shrink-0 flex items-center gap-2">
            <AlertMenu />
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="hover:bg-primary-foreground/10 focus-visible:ring-primary-foreground">
                        <Languages className="h-5 w-5" />
                        <span className="sr-only">Change Language</span>
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
  )
}
