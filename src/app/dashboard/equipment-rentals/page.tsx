
"use client";

import { useState } from "react";
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
import { MapPin, PlusCircle, ArrowUpDown, UploadCloud, Calendar as CalendarIcon, Clock } from "lucide-react";
import { useTranslation } from "@/context/translation-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Equipment {
  id: number;
  name: string;
  image: string;
  hint: string;
  price: number; // Price per day
  owner: string;
  location: string;
  distance: number;
  available: boolean;
}

const initialEquipmentData: Equipment[] = [
  { id: 1, name: "Tractor", image: "https://placehold.co/600x400.png", hint: "tractor farming", price: 1500, owner: "Ramesh Patel", location: "Pune", distance: 12, available: true },
  { id: 2, name: "Cultivator", image: "https://placehold.co/600x400.png", hint: "farm cultivator", price: 500, owner: "Sita Devi", location: "Nashik", distance: 85, available: true },
  { id: 3, name: "Rotavator", image: "https://placehold.co/600x400.png", hint: "farm rotavator", price: 700, owner: "Amit Singh", location: "Indore", distance: 250, available: false },
  { id: 4, name: "Plough", image: "https://placehold.co/600x400.png", hint: "field plough", price: 300, owner: "Sunita Pawar", location: "Pune", distance: 15, available: true },
  { id: 5, name: "Combine Harvester", image: "https://placehold.co/600x400.png", hint: "combine harvester", price: 3000, owner: "Vikram Bhosle", location: "Ludhiana", distance: 1200, available: true },
  { id: 6, name: "Water Pump", image: "https://placehold.co/600x400.png", hint: "irrigation pump", price: 400, owner: "Meena Kumari", location: "Nashik", distance: 92, available: false },
  { id: 7, name: "Sprayer", image: "https://placehold.co/600x400.png", hint: "farm sprayer", price: 600, owner: "Ramesh Patel", location: "Pune", distance: 14, available: true },
  { id: 8, name: "Power Tiller", image: "https://placehold.co/600x400.png", hint: "power tiller", price: 800, owner: "Amit Singh", location: "Indore", distance: 245, available: true },
];

const locations = ["All Locations", ...Array.from(new Set(initialEquipmentData.map(item => item.location)))];

export default function EquipmentRentalsPage() {
    const { t } = useTranslation();
    const [equipmentData, setEquipmentData] = useState(initialEquipmentData);
    const [selectedLocation, setSelectedLocation] = useState("All Locations");
    const [sortBy, setSortBy] = useState("distance");
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
    const [isRentDialogOpen, setIsRentDialogOpen] = useState(false);
    const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
    const [rentalDate, setRentalDate] = useState<Date | undefined>(new Date());
    const [rentalHours, setRentalHours] = useState<number>(8);
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
        const newEquipment: Equipment = {
            id: equipmentData.length + 1,
            name: newItemName,
            price: parseInt(newItemPrice),
            location: newItemLocation,
            image: previewUrl!,
            hint: newItemName.toLowerCase(),
            owner: "You",
            distance: 0,
            available: true,
        };
        setEquipmentData([newEquipment, ...equipmentData]);
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

    const handleRentClick = (item: Equipment) => {
        setSelectedEquipment(item);
        setIsRentDialogOpen(true);
    };

    const handleConfirmBooking = () => {
        if (!selectedEquipment) return;
        setEquipmentData(prevData =>
            prevData.map(item =>
                item.id === selectedEquipment.id ? { ...item, available: false } : item
            )
        );
        setIsRentDialogOpen(false);
        toast({
            title: "Booking Confirmed!",
            description: `You have successfully rented the ${selectedEquipment.name}.`,
        });
        // Reset state for next time
        setRentalDate(new Date());
        setRentalHours(8);
    };
    
    const calculateTotal = () => {
        if (!selectedEquipment) return 0;
        const pricePerDay = selectedEquipment.price;
        const pricePerHour = pricePerDay / 8; // Assuming an 8-hour workday
        return pricePerHour * rentalHours;
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
    <>
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
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{t('equipmentRentals.uploadTitle')}</DialogTitle>
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
                             <div className="space-y-2">
                                <Label htmlFor="image-upload">{t('equipmentRentals.uploadImageLabel')}</Label>
                                <label htmlFor="image-upload-input" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-secondary">
                                  {previewUrl ? (
                                    <Image src={previewUrl} alt="Preview" width={100} height={100} className="h-full w-auto object-contain p-2" />
                                  ) : (
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <UploadCloud className="w-8 h-8 mb-4 text-muted-foreground" />
                                        <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">{t('register.clickToUpload')}</span></p>
                                    </div>
                                  )}
                                  <Input id="image-upload-input" type="file" className="hidden" onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" />
                              </label>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit">{t('equipmentRentals.uploadSubmitButton')}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
      </PageHeader>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredAndSortedData.map((item) => (
          <Card key={item.id} className="overflow-hidden bg-card border-border hover:border-primary transition-all duration-300 group">
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
                <Button disabled={!item.available} onClick={() => handleRentClick(item)}>{t('equipmentRentals.rentNow')}</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      {/* Rental Dialog */}
      <Dialog open={isRentDialogOpen} onOpenChange={setIsRentDialogOpen}>
          <DialogContent className="sm:max-w-md">
              <DialogHeader>
                  <DialogTitle>Rent: {selectedEquipment?.name}</DialogTitle>
                  <DialogDescription>Select a date and duration for your rental.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                  <div className="grid items-center gap-2">
                      <Label htmlFor="date">Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !rentalDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {rentalDate ? format(rentalDate, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={rentalDate}
                            onSelect={setRentalDate}
                            initialFocus
                            disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1))}
                          />
                        </PopoverContent>
                      </Popover>
                  </div>
                   <div className="grid items-center gap-2">
                      <Label htmlFor="hours">Number of Hours (1-12)</Label>
                       <Input
                         id="hours"
                         type="number"
                         min="1"
                         max="12"
                         value={rentalHours}
                         onChange={(e) => setRentalHours(Math.max(1, Math.min(12, Number(e.target.value))))}
                       />
                  </div>
                  <div className="mt-4 pt-4 border-t">
                      <div className="flex justify-between items-center font-semibold text-lg">
                          <span>Total Bill:</span>
                          <span>₹{calculateTotal().toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Based on ₹{selectedEquipment?.price}/day (8 hours)</p>
                  </div>
              </div>
              <DialogFooter>
                  <Button variant="secondary" onClick={() => setIsRentDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleConfirmBooking}>Confirm Booking & Pay</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </>
  );
}

    