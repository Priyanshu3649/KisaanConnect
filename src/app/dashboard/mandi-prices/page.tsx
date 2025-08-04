
"use client";

import { useState, useEffect } from "react";
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
import { ArrowDown, ArrowUp, Loader2 } from "lucide-react";
import { useTranslation } from "@/context/translation-context";
import { getMandiPrices, type CropPrice } from "@/ai/flows/mandi-prices";
import { useToast } from "@/hooks/use-toast";

const markets = ["All Markets", "Pune", "Nashik", "Indore", "Ludhiana", "Nagpur", "Aurangabad", "Kolhapur"];

const recommendationColors: { [key: string]: string } = {
  "Sell Now": "bg-red-500",
  "Hold": "bg-yellow-500",
  "Good Price": "bg-green-500",
};

export default function MandiPricesPage() {
  const { t } = useTranslation();
  const [selectedMarket, setSelectedMarket] = useState("All Markets");
  const [mandiData, setMandiData] = useState<CropPrice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPrices = async () => {
      setIsLoading(true);
      try {
        const data = await getMandiPrices({ market: selectedMarket });
        setMandiData(data);
      } catch (error) {
        console.error("Failed to fetch mandi prices:", error);
        toast({
          variant: "destructive",
          title: "Failed to load prices",
          description: "Could not fetch market data. Please try again later.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrices();
  }, [selectedMarket, toast]);

  return (
    <AppLayout>
      <PageHeader
        title={t('nav.mandiPrices')}
        description={t('mandi.pageDescription')}
      >
        <Select value={selectedMarket} onValueChange={setSelectedMarket} disabled={isLoading}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('mandi.selectMarket')} />
          </SelectTrigger>
          <SelectContent>
            {markets.map(market => (
              <SelectItem key={market} value={market}>{market === "All Markets" ? t('mandi.allMarkets') : market}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PageHeader>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('mandi.cropVariety')}</TableHead>
                <TableHead>{t('mandi.market')}</TableHead>
                <TableHead className="text-right">{t('mandi.price')}</TableHead>
                <TableHead>{t('mandi.recommendation')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-48 text-center">
                    <div className="flex justify-center items-center gap-2">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        <span className="text-muted-foreground">Fetching latest prices...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : mandiData.length > 0 ? (
                mandiData.map((item, index) => (
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
                        {t(`mandi.reco.${item.recommendation.replace(' ', '')}` as any)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                 <TableRow>
                    <TableCell colSpan={4} className="h-48 text-center">
                        <p className="text-muted-foreground">No data available for this market.</p>
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
