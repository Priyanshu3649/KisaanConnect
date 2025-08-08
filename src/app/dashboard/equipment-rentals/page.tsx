
"use client";

import { useState, useEffect } from "react";
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
import { MapPin, PlusCircle, ArrowUpDown, Tractor as TractorIcon, Loader2 } from "lucide-react";
import { useTranslation } from "@/context/translation-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthState } from "react-firebase-hooks/auth";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, query, orderBy, Timestamp } from "firebase/firestore";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";


interface Equipment {
  id?: string;
  name: string;
  image: string; // Will be a placeholder path
  price: number;
  ownerName: string;
  ownerId: string;
  location: string;
  available: boolean;
  createdAt: Timestamp;
}

export default function EquipmentRentalsPage() {
    const { t } = useTranslation();
    const [user] = useAuthState(auth);
    const [sortBy, setSortBy] = useState("createdAt");
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
    const { toast } = useToast();
    
    const equipmentQuery = query(collection(db, "equipment"), orderBy(sortBy === 'price_asc' || sortBy === 'price_desc' ? 'price' : 'createdAt', sortBy === 'price_desc' ? 'desc' : 'asc'));
    const [equipmentData, loading, error] = useCollectionData(equipmentQuery, { idField: 'id' });

    const [newItemName, setNewItemName] = useState('');
    const [newItemPrice, setNewItemPrice] = useState('');
    const [newItemLocation, setNewItemLocation] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    const handleUploadSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemName || !newItemPrice || !newItemLocation || !user) {
             toast({
                variant: "destructive",
                title: "Missing Information",
                description: "Please fill out all fields.",
            });
            return;
        }
        setIsUploading(true);

        try {
            const newEquipment = {
                name: newItemName,
                price: parseInt(newItemPrice),
                location: newItemLocation,
                image: "/tractor_placeholder.svg", // Using a static placeholder
                ownerName: user.displayName || "Anonymous",
                ownerId: user.uid,
                available: true,
                createdAt: serverTimestamp(),
            };
            await addDoc(collection(db, "equipment"), newEquipment);
            
            setNewItemName('');
            setNewItemPrice('');
            setNewItemLocation('');
            setIsUploadDialogOpen(false);
            toast({
                title: "Upload Successful",
                description: `${newItemName} has been listed for rent.`,
            });
        } catch(error: any) {
            console.error("Error uploading equipment:", error);
            toast({
                variant: "destructive",
                title: "Upload Failed",
                description: `There was an error listing your equipment: ${error.message}`,
            });
        } finally {
            setIsUploading(false);
        }
    };

    const sortedData = equipmentData?.sort((a, b) => {
        if (sortBy === 'price_asc') return (a as Equipment).price - (b as Equipment).price;
        if (sortBy === 'price_desc') return (b as Equipment).price - (a as Equipment).price;
        // Default to newest first
        return (b.createdAt as Timestamp)?.toMillis() - (a.createdAt as Timestamp)?.toMillis();
    }) as Equipment[] | undefined;

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
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                  <SelectItem value="createdAt">{t('equipmentRentals.sortByDistance')}</SelectItem>
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
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{t('equipmentRentals.uploadTitle')}</DialogTitle>
                        <DialogDescription>Your listing will be visible to all farmers on the platform.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUploadSubmit}>
                        <div className="grid gap-4 py-4">
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
        </div>
      </PageHeader>
      {loading && (
          <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
      )}
      {!loading && (!equipmentData || equipmentData.length === 0) && (
          <div className="text-center py-10 text-muted-foreground">
              <p>No equipment listed yet.</p>
              <p>Be the first to list something for rent!</p>
          </div>
      )}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sortedData?.map((item) => (
          <Card key={item.id} className="overflow-hidden bg-card border-border hover:border-primary transition-all duration-300 group">
            <CardHeader className="p-0">
              <div className="relative aspect-video w-full flex items-center justify-center bg-muted">
                <TractorIcon className="w-16 h-16 text-muted-foreground" />
                <Badge className={`absolute top-2 right-2 border-none ${item.available ? "bg-green-500" : "bg-red-500"} text-white`}>
                  {item.available ? t('equipmentRentals.available') : t('equipmentRentals.rented')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <CardTitle className="font-headline text-xl mb-2">{item.name}</CardTitle>
              <div className="text-muted-foreground text-sm space-y-2">
                <p>{t('equipmentRentals.owner')}: {item.ownerName}</p>
                <p className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {item.location}</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center p-4 pt-0">
                <p className="text-lg font-bold">₹{item.price}<span className="text-sm font-normal text-muted-foreground">/{t('equipmentRentals.day')}</span></p>
                <Button disabled={!item.available} variant="outline">{t('equipmentRentals.rentNow')}</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </>
  );
}
