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
import { MapPin } from "lucide-react";

const equipmentData = [
  { name: "Tractor", image: "https://placehold.co/600x400.png", hint: "tractor farming", price: 1500, owner: "Ramesh Patel", location: "Pune", available: true },
  { name: "Cultivator", image: "https://placehold.co/600x400.png", hint: "farm cultivator", price: 500, owner: "Sita Devi", location: "Nashik", available: true },
  { name: "Rotavator", image: "https://placehold.co/600x400.png", hint: "farm rotavator", price: 700, owner: "Amit Singh", location: "Indore", available: false },
  { name: "Plough", image: "https://placehold.co/600x400.png", hint: "field plough", price: 300, owner: "Sunita Pawar", location: "Pune", available: true },
  { name: "Harvester", image: "https://placehold.co/600x400.png", hint: "combine harvester", price: 3000, owner: "Vikram Bhosle", location: "Ludhiana", available: true },
  { name: "Water Pump", image: "https://placehold.co/600x400.png", hint: "irrigation pump", price: 400, owner: "Meena Kumari", location: "Nashik", available: false },
];

const locations = ["All Locations", ...Array.from(new Set(equipmentData.map(item => item.location)))];

export default function EquipmentRentalsPage() {
    const [selectedLocation, setSelectedLocation] = useState("All Locations");

    const filteredData = selectedLocation === "All Locations"
        ? equipmentData
        : equipmentData.filter(item => item.location === selectedLocation);

  return (
    <AppLayout>
      <PageHeader
        title="Equipment Rentals"
        description="Borrow or lend farm equipment with nearby farmers."
      >
        <Select value={selectedLocation} onValueChange={setSelectedLocation}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select a location" />
          </SelectTrigger>
          <SelectContent>
            {locations.map(location => (
              <SelectItem key={location} value={location}>{location}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PageHeader>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredData.map((item, index) => (
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
                  {item.available ? "Available" : "Rented"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <CardTitle className="font-headline text-xl mb-2">{item.name}</CardTitle>
              <div className="text-muted-foreground text-sm space-y-2">
                <p>Owner: {item.owner}</p>
                <p className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {item.location}</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center p-4 pt-0">
                <p className="text-lg font-bold">₹{item.price}<span className="text-sm font-normal text-muted-foreground">/day</span></p>
                <Button disabled={!item.available} className="bg-primary hover:bg-primary/90 text-primary-foreground">Rent Now</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </AppLayout>
  );
}
