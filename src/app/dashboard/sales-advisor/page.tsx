
"use client";

import { useState, useEffect, useMemo } from "react";
import PageHeader from "@/components/page-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, HelpCircle, CheckCircle2, XCircle, Clock, ShoppingCart } from "lucide-react";
import { useTranslation } from "@/context/translation-context";
import { getSalesAdvice, type SalesAdviceOutput } from "@/ai/flows/sales-advisor";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { format, parseISO } from 'date-fns';

const commodities = ["Potato", "Onion", "Tomato", "Wheat", "Soybean", "Cotton"];
const states: { [key: string]: string[] } = {
  "Maharashtra": ["Pune", "Nashik", "Nagpur"],
  "Punjab": ["Ludhiana", "Amritsar"],
  "Haryana": ["Sonipat", "Karnal"],
};
const allStates = Object.keys(states);

const recommendationConfig = {
    'Strong Sell': { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/50' },
    'Sell': { icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/50' },
    'Hold': { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/50' },
    'Buy': { icon: ShoppingCart, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/50' },
};


export default function SalesAdvisorPage() {
  const { t, language } = useTranslation();
  const [selectedCommodity, setSelectedCommodity] = useState("Potato");
  const [selectedState, setSelectedState] = useState("Maharashtra");
  const [selectedMarket, setSelectedMarket] = useState("Pune");
  
  const [advice, setAdvice] = useState<SalesAdviceOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const availableMarkets = useMemo(() => states[selectedState] || [], [selectedState]);

  useEffect(() => {
    if (availableMarkets.length > 0 && !availableMarkets.includes(selectedMarket)) {
      setSelectedMarket(availableMarkets[0]);
    }
  }, [selectedState, availableMarkets, selectedMarket]);


  useEffect(() => {
    const fetchAdvice = async () => {
      if (!selectedCommodity || !selectedState || !selectedMarket) {
        setAdvice(null);
        setIsLoading(false);
        return;
      };

      setIsLoading(true);
      setAdvice(null);
      try {
        const data = await getSalesAdvice({ 
          commodity: selectedCommodity,
          state: selectedState,
          market: selectedMarket,
          language: language
        });
        setAdvice(data);
      } catch (error) {
        console.error("Failed to fetch sales advice:", error);
        toast({
          variant: "destructive",
          title: t('salesAdvisor.errorTitle'),
          description: (error as Error).message || t('salesAdvisor.errorDesc'),
        });
        setAdvice(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdvice();
  }, [selectedCommodity, selectedState, selectedMarket, toast, language, t]);

  const renderContent = () => {
      if (isLoading) {
          return (
             <div className="flex flex-col items-center justify-center h-96 gap-4 text-muted-foreground">
                <Loader2 className="h-12 w-12 animate-spin" />
                <p>{t('salesAdvisor.loading')}</p>
             </div>
          );
      }
      if (!advice) {
          return (
             <div className="flex flex-col items-center justify-center h-96 gap-4 text-muted-foreground">
                <HelpCircle className="h-12 w-12" />
                <p>{t('salesAdvisor.noData')}</p>
             </div>
          );
      }
      
      const config = recommendationConfig[advice.recommendation];
      const Icon = config.icon;

      return (
          <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-6">
                 <Alert className={`${config.bg} ${config.border}`}>
                    <Icon className={`h-5 w-5 ${config.color}`} />
                    <AlertTitle className={`text-xl font-bold ${config.color}`}>{t(`salesAdvisor.reco.${advice.recommendation.replace(' ','')}` as any)}</AlertTitle>
                 </Alert>

                 <Card>
                    <CardHeader>
                        <CardTitle>{t('salesAdvisor.confidence')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <Progress value={advice.confidence * 100} className="w-full" />
                            <span className="font-bold text-lg">{(advice.confidence * 100).toFixed(0)}%</span>
                        </div>
                    </CardContent>
                 </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>{t('salesAdvisor.reasoning')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">{advice.reasoning}</p>
                    </CardContent>
                 </Card>
              </div>

              <div className="lg:col-span-2">
                 <Card>
                    <CardHeader>
                        <CardTitle>{t('salesAdvisor.forecastTitle')}</CardTitle>
                        <CardDescription>{t('salesAdvisor.forecastDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="h-80 pr-6">
                         <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={advice.priceForecast} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis 
                                    dataKey="date" 
                                    tickFormatter={(str) => format(parseISO(str), 'MMM d')}
                                    stroke="hsl(var(--muted-foreground))"
                                    fontSize={12}
                                />
                                <YAxis 
                                    stroke="hsl(var(--muted-foreground))"
                                    fontSize={12}
                                    tickFormatter={(value) => `₹${value}`}
                                    domain={['dataMin - 50', 'dataMax + 50']}
                                />
                                <Tooltip
                                    contentStyle={{ 
                                        backgroundColor: 'hsl(var(--background))', 
                                        borderColor: 'hsl(var(--border))' 
                                    }}
                                    labelFormatter={(label) => format(parseISO(label), 'PPP')}
                                    formatter={(value) => [`₹${value}`, t('mandi.price')]}
                                />
                                <Line type="monotone" dataKey="price" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: 'hsl(var(--primary))' }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                 </Card>
              </div>
          </div>
      )
  }

  return (
    <>
      <PageHeader
        title={t('nav.salesAdvisor')}
        description={t('salesAdvisor.pageDescription')}
      >
        <div className="flex gap-2 flex-wrap">
            <Select value={selectedCommodity} onValueChange={setSelectedCommodity} disabled={isLoading}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder={t('salesAdvisor.selectCommodity')} />
              </SelectTrigger>
              <SelectContent>
                {commodities.map(item => (
                  <SelectItem key={item} value={item}>{item}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedState} onValueChange={setSelectedState} disabled={isLoading}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder={t('salesAdvisor.selectState')} />
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
      
      {renderContent()}
    </>
  );
}

    