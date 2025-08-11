
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/context/translation-context";
import { type NavItem } from "./app-layout";
import { Leaf } from 'lucide-react';
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

interface SidebarProps {
  navItems: NavItem[];
}

export default function Sidebar({ navItems }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <div className="hidden border-r bg-muted/40 md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-16 items-center border-b px-4 lg:px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-primary">
            <Leaf className="h-6 w-6" />
            <span className="">KisaanConnect</span>
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {navItems.map((item) => {
              const Icon = LucideIcons[item.icon] as React.ElementType;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                    isActive && "bg-muted text-primary"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {t(item.labelKey as any)}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="mt-auto p-4 border-t">
            <Card>
                <CardHeader>
                    <CardTitle>{t('customerSupport.sidebarTitle')}</CardTitle>
                    <CardDescription className="text-xs mt-1">{t('customerSupport.sidebarDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Link href="/dashboard/customer-support">
                        <Button size="sm" className="w-full">{t('nav.customerSupport')}</Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
