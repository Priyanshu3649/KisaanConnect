"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";
import { useTranslation } from "@/context/translation-context";
import UserNav from "./user-nav";
import AlertMenu from "./alert-menu";


export default function AppHeader() {
  const { setLanguage, language } = useTranslation();

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-6 lg:h-[60px]">
        <div className="w-full flex-1">
            {/* Optional: Add a global search bar here */}
        </div>
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
    </header>
  )
}
