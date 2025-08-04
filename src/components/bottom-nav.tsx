
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useTranslation } from "@/context/translation-context";

interface NavItem {
  href: string;
  icon: LucideIcon;
  labelKey: string;
}

interface BottomNavProps {
  navItems: NavItem[];
}

export default function BottomNav({ navItems }: BottomNavProps) {
  const pathname = usePathname();
  const { t } = useTranslation();

  // Filter out Help & Feedback from bottom nav
  const bottomNavItems = navItems.filter(item => item.href !== '/dashboard/help-feedback');

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border z-40">
      <TooltipProvider delayDuration={0}>
        <div className={`grid h-full`} style={{ gridTemplateColumns: `repeat(${bottomNavItems.length}, 1fr)`}}>
          {bottomNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 text-muted-foreground transition-colors",
                      isActive ? "text-primary" : "hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-6 w-6" />
                    <span className="text-xs font-medium sr-only">{t(`nav.${item.labelKey}`)}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>{t(`nav.${item.labelKey}`)}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    </div>
  );
}
