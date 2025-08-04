
"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Languages, Leaf } from "lucide-react";
import { useTranslation } from "@/context/translation-context";
import UserNav from "./user-nav";
import AlertMenu from "./alert-menu";
import Link from "next/link";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePathname } from "next/navigation";
import type { NavItem } from "./app-layout"; // Import the type from app-layout

interface AppHeaderProps {
    navItems: NavItem[];
}

export default function AppHeader({ navItems }: AppHeaderProps) {
  const { setLanguage, language, t } = useTranslation();
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const currentPage = navItems.find(item => item.href === pathname);

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-accent/80 backdrop-blur-sm px-4 md:px-6 text-accent-foreground">
        <div className="flex-1">
          <Link href="/dashboard" className="flex items-center gap-2 font-headline font-bold text-primary">
            <Leaf className="h-7 w-7" />
            <span className="text-2xl hidden md:inline-block">KisaanConnect</span>
          </Link>
        </div>
        
        {isMobile && currentPage && (
          <div className="flex-1 text-center">
            <h1 className="font-headline text-xl font-bold tracking-tight">
              {t(currentPage.labelKey as any)}
            </h1>
          </div>
        )}

        <div className="flex-shrink-0 flex items-center gap-2">
            <AlertMenu />
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
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
