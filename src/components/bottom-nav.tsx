// src/components/bottom-nav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
}

interface BottomNavProps {
  navItems: NavItem[];
}

export default function BottomNav({ navItems }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border z-40">
      <div className="grid h-full grid-cols-6">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-muted-foreground transition-colors",
                isActive ? "text-primary" : "hover:text-foreground"
              )}
            >
              <item.icon className="h-6 w-6" />
              <span className="text-xs font-medium sr-only">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
