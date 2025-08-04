
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/context/translation-context";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

interface NavItem {
  href: string;
  icon: keyof typeof LucideIcons;
  labelKey: string;
}

interface BottomNavProps {
  navItems: NavItem[];
}

export default function BottomNav({ navItems }: BottomNavProps) {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-accent border-t border-accent/50 text-accent-foreground">
      <div className="grid h-full max-w-lg grid-cols-6 mx-auto font-medium">
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
                        isActive ? "text-primary-foreground" : ""
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
