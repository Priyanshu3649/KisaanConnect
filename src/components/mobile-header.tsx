
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import * as LucideIcons from "lucide-react";
import { useTranslation } from "@/context/translation-context";
import { cn } from "@/lib/utils";
import UserNav from "./user-nav";

interface NavItem {
  href: string;
  icon: keyof typeof LucideIcons;
  labelKey: string;
  badge?: string;
}

interface MobileHeaderProps {
  navItems: NavItem[];
}

export default function MobileHeader({ navItems }: MobileHeaderProps) {
  const pathname = usePathname();
  const { t } = useTranslation();
  
  return (
    <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30 bg-background">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <LucideIcons.Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col">
          <nav className="grid gap-2 text-lg font-medium">
            <Link
              href="#"
              className="flex items-center gap-2 text-lg font-semibold mb-4"
            >
              <LucideIcons.Leaf className="h-6 w-6 text-primary" />
               <span className="font-headline text-xl font-bold">KisaanConnect</span>
            </Link>
            {navItems.map((item) => {
              const Icon = LucideIcons[item.icon] as React.ElementType;
              const isActive = pathname === item.href;
              return (
                 <Link
                    key={item.labelKey}
                    href={item.href}
                    className={cn(
                        "mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground",
                        isActive && "bg-muted text-foreground"
                    )}
                    >
                    <Icon className="h-5 w-5" />
                    {t(`nav.${item.labelKey}`)}
                </Link>
              )
            })}
          </nav>
        </SheetContent>
      </Sheet>

      <div className="w-full flex-1">
         <h1 className="font-headline text-xl font-bold tracking-tight">
            {t(`nav.${navItems.find(item => item.href === pathname)?.labelKey || 'dashboard'}`)}
         </h1>
      </div>
      <UserNav />
    </header>
  );
}
