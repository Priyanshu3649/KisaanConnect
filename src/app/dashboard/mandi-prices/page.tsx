
"use client";

import { useState, useEffect, useMemo } from "react";
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
import { Loader2, TrendingUp } from "lucide-react";
import { useTranslation } from "@/context/translation-context";
import { getMandiPrices, type MandiPriceRecord } from "@/ai/flows/mandi-prices";
import { useToast } from "@/hooks/use-toast";

const commodities = ["Potato", "Onion", "Tomato", "Wheat", "Soybean", "Cotton"];
const states: { [key: string]: string[] } = {
  "Maharashtra": ["Pune", "Nashik", "Nagpur", "Aurangabad"],
  "Madhya Pradesh": ["Indore"],
  "Punjab": ["Ludhiana"],
  "Karnataka": ["Bangalore"],
};
const allStates = Object.keys(states);

const getPriceTrend = (currentPrice: number, prevPrice: number | null) => {
    if (prevPrice === null || currentPrice === prevPrice) return 'stable';
    if (currentPrice > prevPrice) return 'up';
    return 'down';
};


export default function MandiPricesPage() {
  const { t } = useTranslation();
  const [selectedCommodity, setSelectedCommodity] = useState("Potato");
  const [selectedState, setSelectedState] = useState("Maharashtra");
  const [selectedMarket, setSelectedMarket] = useState("Pune");
  
  const [mandiData, setMandiData] = useState<MandiPriceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const availableMarkets = useMemo(() => states[selectedState] || [], [selectedState]);

  useEffect(() => {
    if (availableMarkets.length > 0 && !availableMarkets.includes(selectedMarket)) {
      setSelectedMarket(availableMarkets[0]);
    }
  }, [selectedState, availableMarkets, selectedMarket]);


  useEffect(() => {
    const fetchPrices = async () => {
      if (!selectedCommodity || !selectedState || !selectedMarket) {
        setMandiData([]);
        return;
      };

      setIsLoading(true);
      try {
        const data = await getMandiPrices({ 
          commodity: selectedCommodity,
          state: selectedState,
          market: selectedMarket 
        });
        setMandiData(data);
      } catch (error) {
        console.error("Failed to fetch mandi prices:", error);
        toast({
          variant: "destructive",
          title: "Failed to load prices",
          description: "Could not fetch market data. Please try again later.",
        });
        setMandiData([]); // Clear data on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrices();
  }, [selectedCommodity, selectedState, selectedMarket, toast]);
  
  const processedData = useMemo(() => {
    if (!mandiData || mandiData.length === 0) return [];
    
    const sortedData = [...mandiData].sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime());

    return sortedData.map((item, index) => {
        const prevPriceRecord = sortedData[index + 1]; // Compare with the next item (previous day)
        const prevPrice = prevPriceRecord ? parseInt(prevPriceRecord['Model Prize']) : null;
        const trend = getPriceTrend(parseInt(item['Model Prize']), prevPrice);
        return { ...item, trend };
    });
  }, [mandiData]);


  return (
    <AppLayout>
      <PageHeader
        title={t('nav.mandiPrices')}
        description={t('mandi.pageDescription')}
      >
        <div className="flex gap-2 flex-wrap">
            <Select value={selectedCommodity} onValueChange={setSelectedCommodity} disabled={isLoading}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Select Commodity" />
              </SelectTrigger>
              <SelectContent>
                {commodities.map(item => (
                  <SelectItem key={item} value={item}>{item}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedState} onValueChange={setSelectedState} disabled={isLoading}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Select State" />
              </SelectTrigger>
              <SelectContent>
                {allStates.map(item => (
                  <SelectItem key={item} value={item}>{item}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedMarket} onValueChange={setSelectedMarket} disabled={isLoading}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder={t('mandi.selectMarket')} />
              </SelectTrigger>
              <SelectContent>
                {availableMarkets.map(market => (
                  <SelectItem key={market} value={market}>{market}</SelectItem>
                ))}
              </SelectContent>
            </Select>
        </div>
      </PageHeader>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Commodity</TableHead>
                <TableHead className="text-right">Min Price (₹)</TableHead>
                <TableHead className="text-right">Max Price (₹)</TableHead>
                <TableHead className="text-right font-semibold text-foreground">Model Price (₹)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center">
                    <div className="flex justify-center items-center gap-2">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        <span className="text-muted-foreground">Fetching latest prices...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : processedData.length > 0 ? (
                processedData.map((item) => (
                  <TableRow key={item['S.No']}>
                    <TableCell className="text-muted-foreground">{item.Date}</TableCell>
                    <TableCell className="font-medium">{item.Commodity}</TableCell>
                    <TableCell className="text-right">{parseInt(item['Min Prize']).toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-right">{parseInt(item['Max Prize']).toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-right font-bold text-primary">
                        <div className="flex items-center justify-end gap-2">
                            <span>
                                {item.trend === 'up' ? '📈' : item.trend === 'down' ? '📉' : ''}
                            </span>
                            <span>{parseInt(item['Model Prize']).toLocaleString('en-IN')}</span>
                        </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                 <TableRow>
                    <TableCell colSpan={5} className="h-48 text-center">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <TrendingUp className="h-10 w-10" />
                            <p>No data available for this selection.</p>
                            <p className="text-xs">Please select a valid commodity, state, and market.</p>
                        </div>
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
