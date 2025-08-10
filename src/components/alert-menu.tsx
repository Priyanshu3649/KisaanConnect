
"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Bell, AlertTriangle, CloudRain, ChevronsDown, Award, TrendingUp } from "lucide-react";
import { useTranslation } from "@/context/translation-context";

const alerts = [
    {
        type: 'success',
        icon: TrendingUp,
        textKey: 'alerts.creditScore'
    },
    {
        type: 'danger',
        icon: AlertTriangle,
        textKey: 'alerts.disease'
    },
    {
        type: 'warning',
        icon: CloudRain,
        textKey: 'alerts.rainfall'
    },
    {
        type: 'info',
        icon: ChevronsDown,
        textKey: 'alerts.priceDrop'
    },
    {
        type: 'success',
        icon: Award,
        textKey: 'alerts.newScheme'
    }
]

const iconColors = {
    danger: "text-red-500",
    warning: "text-yellow-500",
    info: "text-blue-500",
    success: "text-green-500"
}


export default function AlertMenu() {
  const { t } = useTranslation();

  return (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="sr-only">{t('userNav.notifications')}</span>
                {/* Notification dot */}
                <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>{t('alerts.title')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {alerts.map((alert, index) => {
                const Icon = alert.icon;
                return (
                     <DropdownMenuItem key={index} className="flex items-start gap-3">
                        <Icon className={`h-5 w-5 mt-0.5 ${iconColors[alert.type as keyof typeof iconColors]}`} />
                        <span className="whitespace-normal">{t(alert.textKey as any, { points: 25 })}</span>
                    </DropdownMenuItem>
                )
            })}
        </DropdownMenuContent>
    </DropdownMenu>
  )
}
