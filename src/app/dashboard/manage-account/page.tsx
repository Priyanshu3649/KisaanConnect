
"use client";

import { useState, useEffect } from 'react';
import PageHeader from '@/components/page-header';
import { useTranslation } from '@/context/translation-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Mail, Phone, MapPin, Badge, CreditCard } from 'lucide-react';

interface UserDetails {
    name: string;
    email: string;
    photoURL: string;
    phone: string;
    location: string;
    pan: string;
    aadhar: string;
}

const DetailRow = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value?: string | null }) => (
    <div className="flex items-center gap-4 py-3 border-b border-border/50 last:border-none">
        <Icon className="h-5 w-5 text-primary" />
        <div className="flex-1">
            <p className="text-xs text-muted-foreground">{label}</p>
            {value ? <p className="font-medium">{value}</p> : <Skeleton className="h-5 w-32 mt-1" />}
        </div>
    </div>
);

// Function to format Aadhar number
const formatAadhar = (aadhar: string) => {
    if (!aadhar || aadhar.length !== 12) return aadhar;
    return aadhar.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3');
};

export default function ManageAccountPage() {
    const { t } = useTranslation();
    const [user, loading] = useAuthState(auth);
    const [userDetails, setUserDetails] = useState<UserDetails | null>(null);

    useEffect(() => {
        const fetchUserData = async () => {
            if (user) {
                try {
                    const userDocRef = doc(db, 'users', user.uid);
                    const userDoc = await getDoc(userDocRef);
                    if (userDoc.exists()) {
                        setUserDetails(userDoc.data() as UserDetails);
                    }
                } catch (error) {
                    console.error("Error fetching user details:", error);
                }
            }
        };
        if (!loading) {
            fetchUserData();
        }
    }, [user, loading]);

    return (
        <>
            <PageHeader
                title={t('nav.manageAccount')}
                description={t('manageAccount.pageDescription')}
            />
            <div className="flex justify-center">
                <Card className="w-full max-w-2xl">
                    <CardHeader className="text-center">
                        <div className="flex justify-center mb-4">
                            {userDetails ? (
                                <Avatar className="h-24 w-24 border-2 border-primary">
                                    <AvatarImage src={userDetails.photoURL} alt={userDetails.name} />
                                    <AvatarFallback className="text-3xl">
                                        {userDetails.name ? userDetails.name.charAt(0).toUpperCase() : 'U'}
                                    </AvatarFallback>
                                </Avatar>
                            ) : (
                                <Skeleton className="h-24 w-24 rounded-full" />
                            )}
                        </div>
                        {userDetails ? (
                            <>
                                <CardTitle className="text-3xl">{userDetails.name}</CardTitle>
                                <CardDescription>{userDetails.email}</CardDescription>
                            </>
                        ) : (
                            <div className="space-y-2">
                                <Skeleton className="h-8 w-48 mx-auto" />
                                <Skeleton className="h-5 w-64 mx-auto" />
                            </div>
                        )}
                    </CardHeader>
                    <CardContent className="px-6 pb-6">
                        <div className="mt-4">
                            <h3 className="text-lg font-semibold mb-2">{t('manageAccount.personalDetails')}</h3>
                            <DetailRow icon={Phone} label={t('manageAccount.phone')} value={userDetails?.phone} />
                            <DetailRow icon={MapPin} label={t('manageAccount.location')} value={userDetails?.location} />
                        </div>
                         <div className="mt-6">
                            <h3 className="text-lg font-semibold mb-2">{t('manageAccount.verificationDetails')}</h3>
                            <DetailRow icon={CreditCard} label={t('manageAccount.pan')} value={userDetails?.pan} />
                            <DetailRow icon={Badge} label={t('manageAccount.aadhar')} value={formatAadhar(userDetails?.aadhar || '')} />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
