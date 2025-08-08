
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
import { MapPin, PlusCircle, ArrowUpDown, Tractor as TractorIcon, Loader2, UploadCloud, Calendar as CalendarIcon } from "lucide-react";
import { useTranslation } from "@/context/translation-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";


interface Equipment {
  id: string;
  name: string;
  image: string;
  price: number; // Price per day
  ownerName: string;
  location: string;
  available: boolean;
}

const initialEquipment: Equipment[] = [
    { id: "1", name: "John Deere 5050D", image: "https://placehold.co/600x400.png", price: 2500, ownerName: "Sohan Singh", location: "Pune, Maharashtra", available: true },
    { id: "2", name: "Mahindra JIVO 245 DI", image: "https://placehold.co/600x400.png", price: 1800, ownerName: "Rina Patel", location: "Nashik, Maharashtra", available: true },
    { id: "3", name: "Sonalika DI 745 III", image: "https://placehold.co/600x400.png", price: 2200, ownerName: "Amit Kumar", location: "Ludhiana, Punjab", available: false },
    { id: "4", name: "Power Tiller 15HP", image: "https://placehold.co/600x400.png", price: 1200, ownerName: "Vijay More", location: "Bangalore, Karnataka", available: true },
    { id: "5", name: "Rotary Tiller", image: "https://placehold.co/600x400.png", price: 900, ownerName: "Sohan Singh", location: "Pune, Maharashtra", available: true },
    { id: "6", name: "Crop Sprayer (Tractor Mounted)", image: "https://placehold.co/600x400.png", price: 750, ownerName: "Rina Patel", location: "Nashik, Maharashtra", available: true },
];


const RentEquipmentDialog = ({ equipment, onConfirm, t }: { equipment: Equipment | null, onConfirm: (id: string) => void, t: (key: any) => string }) => {
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
                <DialogTitle>Rent: {equipment.name}</DialogTitle>
                <DialogDescription>Select your rental date and duration.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label>Rental Date</Label>
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
                            {date ? format(date, "PPP") : <span>Pick a date</span>}
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
                    <Label htmlFor="hours">Number of Hours</Label>
                    <Input id="hours" type="number" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="e.g., 8" />
                </div>
                <div className="mt-4">
                    <p className="font-semibold">Total Bill:</p>
                    <p className="text-2xl font-bold">₹{totalBill.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-muted-foreground">Calculated at ₹{equipment.price / 8}/hour</p>
                </div>
            </div>
            <DialogFooter>
                <Button onClick={() => onConfirm(equipment.id)} disabled={!date || !hours || parseInt(hours) <= 0}>Confirm Booking</Button>
            </DialogFooter>
        </DialogContent>
    );
}

export default function EquipmentRentalsPage() {
    const { t } = useTranslation();
    const [equipmentList, setEquipmentList] = useState<Equipment[]>(initialEquipment);
    const [sortBy, setSortBy] = useState("createdAt");
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
    const [isRentDialogOpen, setIsRentDialogOpen] = useState(false);
    const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
    const { toast } = useToast();
    
    // Upload Dialog State
    const [newItemName, setNewItemName] = useState('');
    const [newItemPrice, setNewItemPrice] = useState('');
    const [newItemLocation, setNewItemLocation] = useState('');
    const [newItemImage, setNewItemImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);


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
        if (!newItemName || !newItemPrice || !newItemLocation || !newItemImage) {
             toast({ variant: "destructive", title: "Missing Information", description: "Please fill out all fields and upload an image." });
            return;
        }
        setIsUploading(true);

        // Simulate upload delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // In a real app, you would upload to a server/storage here.
        // For this demo, we just show a success message.
        
        setIsUploading(false);
        setIsUploadDialogOpen(false);
        toast({ title: "Upload Successful", description: `${newItemName} has been listed for rent.` });

        // Reset form
        setNewItemName('');
        setNewItemPrice('');
        setNewItemLocation('');
        setNewItemImage(null);
        setPreviewUrl(null);
    };

    const handleRentClick = (equipment: Equipment) => {
        setSelectedEquipment(equipment);
        setIsRentDialogOpen(true);
    };
    
    const handleConfirmRental = (id: string) => {
        setEquipmentList(prevList => prevList.map(item => item.id === id ? { ...item, available: false } : item));
        setIsRentDialogOpen(false);
        setSelectedEquipment(null);
        toast({ title: "Booking Confirmed!", description: "The equipment has been marked as rented." });
    };

    const sortedData = [...equipmentList].sort((a, b) => {
        if (sortBy === 'price_asc') return a.price - b.price;
        if (sortBy === 'price_desc') return b.price - a.price;
        // Default sort (by ID for stability in this demo)
        return parseInt(a.id) - parseInt(b.id);
    });

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
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle>{t('equipmentRentals.uploadTitle')}</DialogTitle>
                        <DialogDescription>Your listing will be visible to all farmers on the platform.</DialogDescription>
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
                                            <p className="text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span></p>
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
        </div>
      </PageHeader>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sortedData.map((item) => (
          <Card key={item.id} className="overflow-hidden bg-card border-border hover:border-primary transition-all duration-300 group flex flex-col">
            <CardHeader className="p-0">
              <div className="relative aspect-video w-full bg-muted overflow-hidden">
                <Image src={item.image} alt={item.name} data-ai-hint="tractor farm equipment" fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                <Badge className={`absolute top-2 right-2 border-none ${item.available ? "bg-green-500" : "bg-red-500"} text-white`}>
                  {item.available ? t('equipmentRentals.available') : t('equipmentRentals.rented')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 flex-grow">
              <CardTitle className="font-headline text-xl mb-2">{item.name}</CardTitle>
              <div className="text-muted-foreground text-sm space-y-2">
                <p>{t('equipmentRentals.owner')}: {item.ownerName}</p>
                <p className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {item.location}</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center p-4 pt-0">
                <p className="text-lg font-bold">₹{item.price}<span className="text-sm font-normal text-muted-foreground">/{t('equipmentRentals.day')}</span></p>
                <Button onClick={() => handleRentClick(item)} disabled={!item.available} variant="outline">{t('equipmentRentals.rentNow')}</Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Dialog open={isRentDialogOpen} onOpenChange={setIsRentDialogOpen}>
          <RentEquipmentDialog equipment={selectedEquipment} onConfirm={handleConfirmRental} t={t} />
      </Dialog>
    </>
  );
}
