
"use client";

import { useState } from "react";
import Image from "next/image";
import AppLayout from "@/components/app-layout";
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
import { MapPin, PlusCircle, ArrowUpDown, UploadCloud } from "lucide-react";
import { useTranslation } from "@/context/translation-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const initialEquipmentData = [
  { name: "Tractor", image: "https://placehold.co/600x400.png", hint: "tractor farming", price: 1500, owner: "Ramesh Patel", location: "Pune", distance: 12, available: true },
  { name: "Cultivator", image: "https://placehold.co/600x400.png", hint: "farm cultivator", price: 500, owner: "Sita Devi", location: "Nashik", distance: 85, available: true },
  { name: "Rotavator", image: "https://placehold.co/600x400.png", hint: "farm rotavator", price: 700, owner: "Amit Singh", location: "Indore", distance: 250, available: false },
  { name: "Plough", image: "https://placehold.co/600x400.png", hint: "field plough", price: 300, owner: "Sunita Pawar", location: "Pune", distance: 15, available: true },
  { name: "Harvester", image: "https://placehold.co/600x400.png", hint: "combine harvester", price: 3000, owner: "Vikram Bhosle", location: "Ludhiana", distance: 1200, available: true },
  { name: "Water Pump", image: "https://placehold.co/600x400.png", hint: "irrigation pump", price: 400, owner: "Meena Kumari", location: "Nashik", distance: 92, available: false },
];

const locations = ["All Locations", ...Array.from(new Set(initialEquipmentData.map(item => item.location)))];

export default function EquipmentRentalsPage() {
    const { t } = useTranslation();
    const [equipmentData, setEquipmentData] = useState(initialEquipmentData);
    const [selectedLocation, setSelectedLocation] = useState("All Locations");
    const [sortBy, setSortBy] = useState("distance");
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
    const { toast } = useToast();

    // New state for the upload form
    const [newItemName, setNewItemName] = useState('');
    const [newItemPrice, setNewItemPrice] = useState('');
    const [newItemLocation, setNewItemLocation] = useState('');
    const [newItemImage, setNewItemImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    const handleUploadSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemName || !newItemPrice || !newItemLocation || !newItemImage) {
             toast({
                variant: "destructive",
                title: "Missing Information",
                description: "Please fill out all fields and upload an image.",
            });
            return;
        }
        const newEquipment = {
            name: newItemName,
            price: parseInt(newItemPrice),
            location: newItemLocation,
            image: previewUrl!, // In a real app, this would be a URL from a storage service
            hint: newItemName.toLowerCase(),
            owner: "You", // Assuming the current user is the owner
            distance: 0, // Assuming it's at the user's location
            available: true,
        };
        setEquipmentData([newEquipment, ...equipmentData]);

        // Reset form and close dialog
        setNewItemName('');
        setNewItemPrice('');
        setNewItemLocation('');
        setNewItemImage(null);
        setPreviewUrl(null);
        setIsUploadDialogOpen(false);
        toast({
            title: "Upload Successful",
            description: `${newItemName} has been listed for rent.`,
        });
    };


    const filteredAndSortedData = equipmentData
        .filter(item => selectedLocation === "All Locations" || item.location === selectedLocation)
        .sort((a, b) => {
            if (sortBy === 'price_asc') return a.price - b.price;
            if (sortBy === 'price_desc') return b.price - a.price;
            if (sortBy === 'distance') return a.distance - b.distance;
            return 0;
        });

  return (
    <AppLayout>
      <PageHeader
        title={t('nav.equipmentRentals')}
        description={t('equipmentRentals.pageDescription')}
      >
        <div className="flex gap-2 flex-wrap">
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('equipmentRentals.selectLocation')} />
              </SelectTrigger>
              <SelectContent>
                {locations.map(location => (
                  <SelectItem key={location} value={location}>{location === "All Locations" ? t('equipmentRentals.allLocations') : location}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                  <SelectItem value="distance">Sort by Distance</SelectItem>
                  <SelectItem value="price_asc">Sort by Price: Low to High</SelectItem>
                  <SelectItem value="price_desc">Sort by Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                <DialogTrigger asChild>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Upload Equipment
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>List Your Equipment</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUploadSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Equipment Name</Label>
                                <Input id="name" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="e.g., John Deere Tractor" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-2">
                                    <Label htmlFor="price">Price (per day)</Label>
                                    <Input id="price" type="number" value={newItemPrice} onChange={(e) => setNewItemPrice(e.target.value)} placeholder="e.g., 1500" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="location">Location</Label>
                                    <Input id="location" value={newItemLocation} onChange={(e) => setNewItemLocation(e.target.value)} placeholder="e.g., Pune" />
                                </div>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="image-upload">Equipment Image</Label>
                                <label htmlFor="image-upload-input" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-secondary">
                                  {previewUrl ? (
                                    <Image src={previewUrl} alt="Preview" width={100} height={100} className="h-full w-auto object-contain p-2" />
                                  ) : (
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <UploadCloud className="w-8 h-8 mb-4 text-muted-foreground" />
                                        <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span></p>
                                    </div>
                                  )}
                                  <Input id="image-upload-input" type="file" className="hidden" onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" />
                              </label>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit">List Equipment</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
      </PageHeader>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredAndSortedData.map((item, index) => (
          <Card key={index} className="overflow-hidden bg-card border-border hover:border-primary transition-all duration-300 group">
            <CardHeader className="p-0">
              <div className="relative">
                <Image
                  src={item.image}
                  alt={item.name}
                  width={600}
                  height={400}
                  className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  data-ai-hint={item.hint}
                />
                <Badge className={`absolute top-2 right-2 border-none ${item.available ? "bg-green-500" : "bg-red-500"} text-white`}>
                  {item.available ? t('equipmentRentals.available') : t('equipmentRentals.rented')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <CardTitle className="font-headline text-xl mb-2">{item.name}</CardTitle>
              <div className="text-muted-foreground text-sm space-y-2">
                <p>{t('equipmentRentals.owner')}: {item.owner}</p>
                <p className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {item.location} (~{item.distance}km away)</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center p-4 pt-0">
                <p className="text-lg font-bold">₹{item.price}<span className="text-sm font-normal text-muted-foreground">/{t('equipmentRentals.day')}</span></p>
                <Button disabled={!item.available} className="bg-primary hover:bg-primary/90 text-primary-foreground">{t('equipmentRentals.rentNow')}</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </AppLayout>
  );
}
