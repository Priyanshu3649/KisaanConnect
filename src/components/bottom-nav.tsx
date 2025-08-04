
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/context/translation-context";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import type { NavItem } from "./app-layout";

interface BottomNavProps {
  navItems: NavItem[];
}

const gridClasses: { [key: number]: string } = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
    7: 'grid-cols-7',
    8: 'grid-cols-8',
    // Add more if needed
};

export default function BottomNav({ navItems }: BottomNavProps) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const gridClass = gridClasses[navItems.length] || 'grid-cols-6';

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-accent border-t border-accent/50 text-accent-foreground">
      <div className={cn("grid h-full max-w-lg mx-auto font-medium", gridClass)}>
        {navItems.map((item) => {
          const Icon = LucideIcons[item.icon] as React.ElementType;
          const isActive = pathname === item.href;
          return (
            <TooltipProvider key={item.href} delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                        "inline-flex flex-col items-center justify-center px-2 sm:px-5 hover:bg-black/10 group",
                        isActive ? "text-primary-foreground bg-black/10" : ""
                    )}
                  >
                    <Icon className="w-6 h-6 mb-1" />
                    <span className="text-xs sm:text-sm sr-only">{t(item.labelKey as any)}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t(item.labelKey as any)}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    </div>
  );
}
