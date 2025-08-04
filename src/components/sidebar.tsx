"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/context/translation-context";
import * as LucideIcons from "lucide-react";
import { Badge } from "./ui/badge";

interface NavItem {
  href: string;
  icon: keyof typeof LucideIcons;
  labelKey: string;
  badge?: string;
}

interface SidebarProps {
  navItems: NavItem[];
}

export default function Sidebar({ navItems }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <div className="hidden border-r bg-muted/40 md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-headline font-bold text-primary">
            <LucideIcons.Leaf className="h-8 w-8" />
            <span className="text-2xl">KisaanConnect</span>
          </Link>
        </div>
        <div className="flex-1">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {navItems.map((item) => {
              const Icon = LucideIcons[item.icon] as React.ElementType;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.labelKey}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                    isActive && "bg-muted text-primary"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {t(item.labelKey as any)}
                  {item.badge && (
                    <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="mt-auto p-4">
          {/* Optional: Add a card or other element at the bottom of the sidebar */}
        </div>
      </div>
    </div>
  );
}
