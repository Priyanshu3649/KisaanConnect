
"use client";

import { useState, useEffect } from 'react';
import PageHeader from '@/components/page-header';
import { useTranslation } from '@/context/translation-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Mail, Phone, MapPin, Badge, CreditCard, Edit, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { updateProfile } from 'firebase/auth';

interface UserDetails {
    name?: string;
    email?: string;
    photoURL?: string;
    phone?: string;
    location?: string;
    pan?: string;
    aadhar?: string;
}

const DetailRow = ({ icon: Icon, label, value, loading }: { icon: React.ElementType, label: string, value?: string | null, loading: boolean }) => (
    <div className="flex items-center gap-4 py-3 border-b border-border/50 last:border-none">
        <Icon className="h-5 w-5 text-primary" />
        <div className="flex-1">
            <p className="text-xs text-muted-foreground">{label}</p>
            {loading ? (
                <Skeleton className="h-5 w-32 mt-1" />
            ) : (
                <p className="font-medium">{value || "Not Provided"}</p>
            )}
        </div>
    </div>
);

// Function to format Aadhar number
const formatAadhar = (aadhar?: string) => {
    if (!aadhar || aadhar.length !== 12) return aadhar;
    return aadhar.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3');
};

const demoUserEmail = "pandeypriyanshu53@gmail.com";
const demoUserDetails: UserDetails = {
    name: "Priyanshu",
    email: demoUserEmail,
    phone: "9313686893",
    location: "P.I.E.T, Haryana",
    pan: "GHEPP9397E",
    aadhar: "334116449837"
};

export default function ManageAccountPage() {
    const { t } = useTranslation();
    const [user, authLoading] = useAuthState(auth);
    const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
    const [isFetchingDetails, setIsFetchingDetails] = useState(true);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    
    const fetchUserData = async () => {
        if (user) {
            if (user.email === demoUserEmail) {
                setUserDetails(demoUserDetails);
                setIsFetchingDetails(false);
                return;
            }

            setIsFetchingDetails(true);
            try {
                const userDocRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    setUserDetails(userDoc.data() as UserDetails);
                } else {
                    setUserDetails({
                        name: user.displayName || 'Anonymous',
                        email: user.email || 'No email',
                        photoURL: user.photoURL || '',
                    });
                }
            } catch (error) {
                console.error("Error fetching user details:", error);
            } finally {
                setIsFetchingDetails(false);
            }
        } else if (!authLoading) {
             setIsFetchingDetails(false);
        }
    };

    useEffect(() => {
        fetchUserData();
    }, [user, authLoading]);

    const isLoading = authLoading || isFetchingDetails;
    const displayName = userDetails?.name || user?.displayName;
    const displayEmail = userDetails?.email || user?.email;
    const displayPhotoURL = userDetails?.photoURL || user?.photoURL;

    return (
        <>
            <PageHeader
                title={t('nav.manageAccount')}
                description={t('manageAccount.pageDescription')}
            />
            <div className="flex justify-center">
                <Card className="w-full max-w-2xl">
                    <CardHeader className="flex flex-row items-start">
                        <div className="flex-grow text-center">
                            <div className="flex justify-center mb-4">
                                {isLoading ? (
                                    <Skeleton className="h-24 w-24 rounded-full" />
                                ) : (
                                    <Avatar className="h-24 w-24 border-2 border-primary">
                                        <AvatarImage src={displayPhotoURL || undefined} alt={displayName || 'User'} />
                                        <AvatarFallback className="text-3xl">
                                            {displayName ? displayName.charAt(0).toUpperCase() : 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                )}
                            </div>
                            {isLoading ? (
                                <div className="space-y-2">
                                    <Skeleton className="h-8 w-48 mx-auto" />
                                    <Skeleton className="h-5 w-64 mx-auto" />
                                </div>
                            ) : (
                                 <>
                                    <CardTitle className="text-3xl">{displayName}</CardTitle>
                                    <CardDescription>{displayEmail}</CardDescription>
                                </>
                            )}
                        </div>
                         <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Edit className="h-5 w-5" />
                                </Button>
                            </DialogTrigger>
                            <EditDetailsDialog 
                                currentUserDetails={userDetails}
                                onSaveSuccess={() => {
                                    setIsEditDialogOpen(false);
                                    fetchUserData(); // Refresh data
                                }}
                            />
                        </Dialog>
                    </CardHeader>
                    <CardContent className="px-6 pb-6">
                        <div className="mt-4">
                            <h3 className="text-lg font-semibold mb-2">{t('manageAccount.personalDetails')}</h3>
                            <DetailRow icon={Phone} label={t('manageAccount.phone')} value={userDetails?.phone} loading={isLoading} />
                            <DetailRow icon={MapPin} label={t('manageAccount.location')} value={userDetails?.location} loading={isLoading} />
                        </div>
                         <div className="mt-6">
                            <h3 className="text-lg font-semibold mb-2">{t('manageAccount.verificationDetails')}</h3>
                            <DetailRow icon={CreditCard} label={t('manageAccount.pan')} value={userDetails?.pan} loading={isLoading} />
                            <DetailRow icon={Badge} label={t('manageAccount.aadhar')} value={formatAadhar(userDetails?.aadhar)} loading={isLoading} />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

// Edit Details Dialog Component
function EditDetailsDialog({ currentUserDetails, onSaveSuccess }: { currentUserDetails: UserDetails | null, onSaveSuccess: () => void }) {
    const { t } = useTranslation();
    const [user] = useAuthState(auth);
    const { toast } = useToast();
    const [formData, setFormData] = useState<UserDetails>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (currentUserDetails) {
            setFormData({
                name: currentUserDetails.name || '',
                phone: currentUserDetails.phone || '',
                location: currentUserDetails.location || '',
                pan: currentUserDetails.pan || '',
                aadhar: currentUserDetails.aadhar?.replace(/\s/g, '') || '',
            });
        }
    }, [currentUserDetails]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleAadharChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
        setFormData(prev => ({ ...prev, aadhar: value.slice(0, 12)}));
    };
    
    const handlePanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.toUpperCase();
        setFormData(prev => ({ ...prev, pan: value.slice(0, 10)}));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsSaving(true);
        
        try {
            const userDocRef = doc(db, "users", user.uid);
            await setDoc(userDocRef, { 
                name: formData.name,
                phone: formData.phone,
                location: formData.location,
                pan: formData.pan,
                aadhar: formData.aadhar,
            }, { merge: true });

            // Also update the auth profile if the name changed
            if (user.displayName !== formData.name) {
                await updateProfile(user, { displayName: formData.name });
            }
            
            toast({ title: "Details Updated", description: "Your profile information has been saved successfully." });
            onSaveSuccess();
        } catch (error) {
            console.error("Error updating details:", error);
            toast({ variant: "destructive", title: "Update Failed", description: "Could not save your changes. Please try again." });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Edit Your Details</DialogTitle>
                <DialogDescription>
                    Update your personal and verification information here. Click save when you're done.
                </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSave}>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" value={formData.name} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input id="phone" value={formData.phone} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input id="location" value={formData.location} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="pan">PAN Number</Label>
                        <Input id="pan" value={formData.pan} onChange={handlePanChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="aadhar">Aadhaar Number</Label>
                        <Input id="aadhar" value={formData.aadhar} onChange={handleAadharChange} />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    )
}
