
"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import Image from "next/image";
import PageHeader from "@/components/page-header";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MapPin, PlusCircle, ArrowUpDown, Tractor as TractorIcon, Loader2, UploadCloud, Calendar as CalendarIcon, Phone, Database } from "lucide-react";
import { useTranslation } from "@/context/translation-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useAuthState } from "react-firebase-hooks/auth";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { auth, db, storage } from "@/lib/firebase";
import { collection, query, addDoc, doc, updateDoc, serverTimestamp, writeBatch } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

interface Equipment {
  id: string;
  name: string;
  image: string;
  price: number; // Price per day
  ownerName: string;
  ownerId: string;
  location: string;
  available: boolean;
  aiHint: string;
  coords: { lat: number; lng: number };
  distance?: number;
}

const demoRentalsData: Omit<Equipment, 'id'|'distance'|'ownerId'|'ownerName'>[] = [
    { name: "John Deere 5050D Tractor", image: "https://placehold.co/600x400.png", price: 2500, location: "Sonipat, Haryana", available: true, aiHint: "green tractor", coords: { lat: 28.9959, lng: 77.0178 } },
    { name: "Mahindra Rotavator", image: "https://placehold.co/600x400.png", price: 1200, location: "Karnal, Haryana", available: true, aiHint: "red rotavator", coords: { lat: 29.6857, lng: 76.9905 } },
    { name: "Power Tiller", image: "https://placehold.co/600x400.png", price: 800, location: "Pune, Maharashtra", available: false, aiHint: "small tiller", coords: { lat: 18.5204, lng: 73.8567 } },
    { name: "Sonalika Thresher", image: "https://placehold.co/600x400.png", price: 1800, location: "Ludhiana, Punjab", available: true, aiHint: "large thresher", coords: { lat: 30.9010, lng: 75.8573 } },
    { name: "Massey Ferguson 241", image: "https://placehold.co/600x400.png", price: 2200, location: "Hisar, Haryana", available: true, aiHint: "red tractor", coords: { lat: 29.1492, lng: 75.7217 } },
    { name: "Crop Sprayer", image: "https://placehold.co/600x400.png", price: 500, location: "Nashik, Maharashtra", available: true, aiHint: "sprayer machine", coords: { lat: 19.9975, lng: 73.7898 } },
];


const RentEquipmentDialog = ({ equipment, onConfirm, t }: { equipment: Equipment | null, onConfirm: (id: string, date: Date, hours: number) => void, t: (key: any) => string }) => {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [hours, setHours] = useState('8');
    const [totalBill, setTotalBill] = useState(0);

    React.useEffect(() => {
        if (equipment) {
            const numHours = parseInt(hours) || 0;
            const pricePerHour = equipment.price / 8; // Assuming 8-hour workday
            setTotalBill(pricePerHour * numHours);
        }
    }, [equipment, hours]);

    if (!equipment) return null;

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{t('equipmentRentals.rentDialogTitle')} {equipment.name}</DialogTitle>
                <DialogDescription>{t('equipmentRentals.rentDialogDesc')}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label>{t('equipmentRentals.rentDateLabel')}</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                                "w-full justify-start text-left font-normal",
                                !date && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, "PPP") : <span>{t('equipmentRentals.pickDate')}</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="hours">{t('equipmentRentals.hoursLabel')}</Label>
                    <Input id="hours" type="number" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="e.g., 8" />
                </div>
                <div className="mt-4">
                    <p className="font-semibold">{t('equipmentRentals.totalBill')}</p>
                    <p className="text-2xl font-bold">₹{totalBill.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-muted-foreground">{t('equipmentRentals.priceCalc', { price: (equipment.price / 8) })}</p>
                </div>
            </div>
            <DialogFooter>
                <Button onClick={() => onConfirm(equipment.id, date!, parseInt(hours))} disabled={!date || !hours || parseInt(hours) <= 0}>{t('equipmentRentals.confirmBooking')}</Button>
            </DialogFooter>
        </DialogContent>
    );
}

// Haversine formula to calculate distance
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
}

export default function EquipmentRentalsPage() {
    const { t } = useTranslation();
    const [user] = useAuthState(auth);
    const rentalsQuery = query(collection(db, "rentals"));
    const [rentals, loading, error] = useCollectionData(rentalsQuery, { idField: 'id' });
    
    const [sortBy, setSortBy] = useState("distance");
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
    const [isRentDialogOpen, setIsRentDialogOpen] = useState(false);
    const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
    const { toast } = useToast();
    
    const [newItemName, setNewItemName] = useState('');
    const [newItemPrice, setNewItemPrice] = useState('');
    const [newItemLocation, setNewItemLocation] = useState('');
    const [newItemImage, setNewItemImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isSeeding, setIsSeeding] = useState(false);

    // Simulate user's location (Sonipat, Haryana) for distance calculation
    const userLocation = { lat: 28.9959, lng: 77.0178 };

    const equipmentList = useMemo(() => {
        if (!rentals) return [];
        return (rentals as Omit<Equipment, 'distance'>[]).map(item => ({
            ...item,
            distance: getDistance(userLocation.lat, userLocation.lng, item.coords.lat, item.coords.lng)
        }));
    }, [rentals]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setNewItemImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUploadSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newItemName || !newItemPrice || !newItemLocation || !newItemImage) {
             toast({ variant: "destructive", title: t('equipmentRentals.missingInfoTitle'), description: t('equipmentRentals.missingInfoDesc') });
            return;
        }
        setIsUploading(true);

        try {
            const storageRef = ref(storage, `rentals/${user.uid}/${Date.now()}_${newItemImage.name}`);
            const snapshot = await uploadBytes(storageRef, newItemImage);
            const imageUrl = await getDownloadURL(snapshot.ref);

            await addDoc(collection(db, "rentals"), {
                name: newItemName,
                image: imageUrl,
                price: parseFloat(newItemPrice),
                ownerName: user.displayName || "Anonymous",
                ownerId: user.uid,
                location: newItemLocation,
                available: true,
                aiHint: "new equipment",
                coords: { lat: userLocation.lat, lng: userLocation.lng }, // Use a geocoding API in a real app
                createdAt: serverTimestamp(),
            });
            
            setIsUploading(false);
            setIsUploadDialogOpen(false);
            toast({ title: t('equipmentRentals.uploadSuccessTitle'), description: t('equipmentRentals.uploadSuccessDesc', { name: newItemName }) });

            // Reset form
            setNewItemName('');
            setNewItemPrice('');
            setNewItemLocation('');
            setNewItemImage(null);
            setPreviewUrl(null);
        } catch (err) {
            console.error("Error uploading equipment:", err);
            toast({ variant: "destructive", title: t('equipmentRentals.uploadFailTitle'), description: t('equipmentRentals.uploadFailDesc')});
            setIsUploading(false);
        }
    };

    const handleRentClick = (equipment: Equipment) => {
        if (equipment.ownerId === user?.uid) {
            toast({ variant: "default", title: t('equipmentRentals.ownEquipmentTitle'), description: t('equipmentRentals.ownEquipmentDesc')});
            return;
        }
        setSelectedEquipment(equipment);
        setIsRentDialogOpen(true);
    };
    
    const handleConfirmRental = async (id: string) => {
        try {
            await updateDoc(doc(db, "rentals", id), { available: false });
            setIsRentDialogOpen(false);
            setSelectedEquipment(null);
            toast({ title: t('equipmentRentals.bookingSuccessTitle'), description: t('equipmentRentals.bookingSuccessDesc') });
        } catch (err) {
             console.error("Error confirming rental:", err);
            toast({ variant: "destructive", title: t('equipmentRentals.bookingFailTitle'), description: t('equipmentRentals.bookingFailDesc')});
        }
    };
    
    const handleContactSeller = (ownerName: string) => {
        toast({
            title: t('equipmentRentals.contactingTitle', { name: ownerName }),
            description: t('equipmentRentals.contactingDesc'),
        });
    }

    const handleSeedData = async () => {
        if (!user) return;
        setIsSeeding(true);
        try {
            const batch = writeBatch(db);
            demoRentalsData.forEach(item => {
                const docRef = doc(collection(db, "rentals"));
                batch.set(docRef, { 
                    ...item, 
                    ownerId: "demo_user", 
                    ownerName: "Demo Farmer", 
                    createdAt: serverTimestamp() 
                });
            });
            await batch.commit();
            toast({
                title: t('equipmentRentals.seedSuccessTitle'),
                description: t('equipmentRentals.seedSuccessDesc', { count: demoRentalsData.length }),
            });
        } catch (e) {
            console.error("Error seeding rental data:", e);
            toast({ variant: 'destructive', title: t('equipmentRentals.seedFailTitle'), description: t('equipmentRentals.seedFailDesc') });
        } finally {
            setIsSeeding(false);
        }
    };

    const sortedData = useMemo(() => 
        [...equipmentList].sort((a, b) => {
            if (sortBy === 'price_asc') return a.price - b.price;
            if (sortBy === 'price_desc') return b.price - a.price;
            if (sortBy === 'distance') return (a.distance ?? Infinity) - (b.distance ?? Infinity);
            return 0; // Default sort
        }), [equipmentList, sortBy]);

  return (
    <>
      <PageHeader
        title={t('nav.equipmentRentals')}
        description={t('equipmentRentals.pageDescription')}
      >
        <div className="flex gap-2 flex-wrap">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                <SelectValue placeholder={t('equipmentRentals.sortBy')} />
              </SelectTrigger>
              <SelectContent>
                  <SelectItem value="distance">{t('equipmentRentals.sortByDistance')}</SelectItem>
                  <SelectItem value="price_asc">{t('equipmentRentals.sortByPriceAsc')}</SelectItem>
                  <SelectItem value="price_desc">{t('equipmentRentals.sortByPriceDesc')}</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                <DialogTrigger asChild>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        {t('equipmentRentals.uploadButton')}
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle>{t('equipmentRentals.uploadTitle')}</DialogTitle>
                        <DialogDescription>{t('equipmentRentals.uploadDesc')}</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUploadSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="image-upload">{t('equipmentRentals.uploadImageLabel')}</Label>
                                 <label htmlFor="image-upload-input" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-secondary">
                                      {previewUrl ? (
                                        <Image src={previewUrl} alt="Preview" width={128} height={128} className="h-full w-auto object-contain p-2" />
                                      ) : (
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
                                            <p className="text-sm text-muted-foreground"><span className="font-semibold">{t('cropDiagnosis.clickToUpload')}</span></p>
                                        </div>
                                      )}
                                      <Input id="image-upload-input" type="file" className="hidden" onChange={handleImageChange} accept="image/png, image/jpeg" />
                                  </label>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="name">{t('equipmentRentals.uploadNameLabel')}</Label>
                                <Input id="name" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder={t('equipmentRentals.uploadNamePlaceholder')} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-2">
                                    <Label htmlFor="price">{t('equipmentRentals.uploadPriceLabel')}</Label>
                                    <Input id="price" type="number" value={newItemPrice} onChange={(e) => setNewItemPrice(e.target.value)} placeholder={t('equipmentRentals.uploadPricePlaceholder')} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="location">{t('equipmentRentals.uploadLocationLabel')}</Label>
                                    <Input id="location" value={newItemLocation} onChange={(e) => setNewItemLocation(e.target.value)} placeholder={t('equipmentRentals.uploadLocationPlaceholder')} />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={isUploading}>
                                {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {t('equipmentRentals.uploadSubmitButton')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
             <Button variant="outline" onClick={handleSeedData} disabled={isSeeding || (rentals && rentals.length > 0)}>
                <Database className="mr-2 h-4 w-4" />
                {isSeeding ? t('equipmentRentals.seeding') : t('equipmentRentals.seedButton')}
            </Button>
        </div>
      </PageHeader>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedData.map((item) => (
            <Card key={item.id} className="overflow-hidden bg-card border-border hover:border-primary transition-all duration-300 group flex flex-col">
                <CardHeader className="p-0">
                <div className="relative aspect-video w-full bg-muted overflow-hidden">
                    <Image src={item.image} alt={item.name} data-ai-hint={item.aiHint} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                    <Badge className={`absolute top-2 right-2 border-none ${item.available ? "bg-green-500" : "bg-red-500"} text-white`}>
                    {item.available ? t('equipmentRentals.available') : t('equipmentRentals.rented')}
                    </Badge>
                </div>
                </CardHeader>
                <CardContent className="p-4 flex-grow">
                <CardTitle className="font-headline text-xl mb-2">{item.name}</CardTitle>
                <div className="text-muted-foreground text-sm space-y-2">
                    <p>{t('equipmentRentals.owner')}: {item.ownerId === user?.uid ? t('equipmentRentals.you') : item.ownerName}</p>
                    <div className="flex items-center justify-between">
                        <p className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {item.location}</p>
                        {item.distance !== undefined && <p className="font-semibold text-xs">{t('equipmentRentals.distanceAway', { dist: item.distance.toFixed(0) })}</p>}
                    </div>
                </div>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row justify-between items-center p-4 pt-0 gap-2">
                    <div className="flex-1 text-center sm:text-left">
                        <p className="text-lg font-bold">₹{item.price}<span className="text-sm font-normal text-muted-foreground">/{t('equipmentRentals.day')}</span></p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button onClick={() => handleContactSeller(item.ownerName)} variant="secondary" className="flex-1">
                            <Phone className="h-4 w-4" />
                        </Button>
                        <Button onClick={() => handleRentClick(item)} disabled={!item.available} variant="outline" className="flex-1">{t('equipmentRentals.rentNow')}</Button>
                    </div>
                </CardFooter>
            </Card>
            ))}
        </div>
      )}

      <Dialog open={isRentDialogOpen} onOpenChange={setIsRentDialogOpen}>
          <RentEquipmentDialog equipment={selectedEquipment} onConfirm={handleConfirmRental as any} t={t} />
      </Dialog>
    </>
  );
}
