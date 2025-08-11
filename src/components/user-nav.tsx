
"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, HelpCircle, Moon, Sun, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { auth, db } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Skeleton } from "./ui/skeleton";
import { useTranslation } from "@/context/translation-context";
import { useTheme } from "next-themes";

interface UserData {
    name: string;
    email: string;
    photoURL: string;
}

export default function UserNav() {
  const { t } = useTranslation();
  const [user, loading] = useAuthState(auth);
  const [userData, setUserData] = useState<UserData | null>(null);
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        // Attempt to get data from Auth profile first for speed
        let name = user.displayName;
        let email = user.email;
        let photoURL = user.photoURL;

        // Then fetch from Firestore for more details if needed, or as a fallback
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const firestoreData = userDoc.data() as UserData;
            // Firestore data is more reliable
            name = firestoreData.name || name;
            email = firestoreData.email || email;
            photoURL = firestoreData.photoURL || photoURL;
          }
        } catch (e) {
            console.error("Error fetching user data from Firestore:", e);
        } finally {
            if (name && email && photoURL) {
                setUserData({ name, email, photoURL });
            }
        }
      }
    };
    if(!loading) {
        fetchUserData();
    }
  }, [user, loading]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  if (loading) {
    return <Skeleton className="h-8 w-8 rounded-full" />;
  }

  return (
    <DropdownMenu>
    <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
        <Avatar className="h-9 w-9">
            <AvatarImage src={userData?.photoURL || user?.photoURL || undefined} alt={userData?.name || 'User'} />
            <AvatarFallback>
                {userData?.name ? userData.name.charAt(0).toUpperCase() : user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
            </AvatarFallback>
        </Avatar>
        </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
        <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userData?.name || user?.displayName || t('userNav.user')}</p>
            <p className="text-xs leading-none text-muted-foreground">
            {userData?.email || user?.email || t('userNav.noEmail')}
            </p>
        </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
             <Link href="/dashboard/manage-account">
                <DropdownMenuItem>
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>{t('nav.manageAccount')}</span>
                </DropdownMenuItem>
            </Link>
            <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                {theme === 'dark' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                <span>{t('userNav.toggleTheme')}</span>
            </DropdownMenuItem>
            <Link href="/dashboard/help-feedback">
                <DropdownMenuItem>
                    <HelpCircle className="mr-2 h-4 w-4" />
                    <span>{t('userNav.helpAndFeedback')}</span>
                </DropdownMenuItem>
            </Link>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>{t('userNav.logout')}</span>
        </DropdownMenuItem>
    </DropdownMenuContent>
    </DropdownMenu>
  );
}
