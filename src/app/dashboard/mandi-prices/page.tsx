"use client";

import { useState } from "react";
import AppLayout from "@/components/app-layout";
import PageHeader from "@/components/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowDown, ArrowUp } from "lucide-react";

const mandiData = [
  { crop: "Tomato", variety: "Desi", price: 2500, market: "Pune", trend: "up", recommendation: "Sell Now" },
  { crop: "Onion", variety: "Red", price: 1800, market: "Nashik", trend: "down", recommendation: "Hold" },
  { crop: "Potato", variety: "Jyoti", price: 2200, market: "Indore", trend: "up", recommendation: "Good Price" },
  { crop: "Wheat", variety: "Lokwan", price: 2100, market: "Ludhiana", trend: "stable", recommendation: "Hold" },
  { crop: "Soybean", variety: "JS-335", price: 4500, market: "Nagpur", trend: "up", recommendation: "Sell Now" },
  { crop: "Cotton", variety: "BT", price: 5500, market: "Aurangabad", trend: "down", recommendation: "Hold" },
  { crop: "Sugarcane", variety: "Co-86032", price: 320, market: "Kolhapur", trend: "stable", recommendation: "Good Price" },
  { crop: "Tomato", variety: "Hybrid", price: 2800, market: "Nashik", trend: "up", recommendation: "Sell Now" },
  { crop: "Onion", variety: "White", price: 2000, market: "Pune", trend: "up", recommendation: "Good Price" },
];

const markets = ["All Markets", ...Array.from(new Set(mandiData.map(item => item.market)))];

const recommendationColors: { [key: string]: string } = {
  "Sell Now": "bg-red-500",
  "Hold": "bg-yellow-500",
  "Good Price": "bg-green-500",
};

export default function MandiPricesPage() {
  const [selectedMarket, setSelectedMarket] = useState("All Markets");

  const filteredData = selectedMarket === "All Markets"
    ? mandiData
    : mandiData.filter(item => item.market === selectedMarket);

  return (
    <AppLayout>
      <PageHeader
        title="Live Mandi Prices"
        description="Real-time market prices for various crops (per quintal)."
      >
        <Select value={selectedMarket} onValueChange={setSelectedMarket}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select a market" />
          </SelectTrigger>
          <SelectContent>
            {markets.map(market => (
              <SelectItem key={market} value={market}>{market}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PageHeader>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Crop (Variety)</TableHead>
                <TableHead>Market</TableHead>
                <TableHead className="text-right">Price (₹)</TableHead>
                <TableHead>Recommendation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="font-medium">{item.crop}</div>
                    <div className="text-sm text-muted-foreground">{item.variety}</div>
                  </TableCell>
                  <TableCell>{item.market}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                        {item.price.toLocaleString('en-IN')}
                        {item.trend === 'up' && <ArrowUp className="h-4 w-4 text-green-500"/>}
                        {item.trend === 'down' && <ArrowDown className="h-4 w-4 text-red-500"/>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge style={{ backgroundColor: recommendationColors[item.recommendation] }} className="text-white">
                      {item.recommendation}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
