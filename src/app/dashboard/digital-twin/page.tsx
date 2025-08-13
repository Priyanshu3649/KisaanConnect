
"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import PageHeader from "@/components/page-header";
import { useTranslation } from "@/context/translation-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sprout, AlertTriangle, Loader2, TestTube2, Droplets, Leaf, MapPinned, Lightbulb, Satellite, DollarSign, TrendingUp, ShieldAlert, BadgePercent, Minus, Plus } from "lucide-react";
import { getDigitalTwinData, type DigitalTwinOutput } from "@/ai/flows/digital-twin";
import { getSatelliteImage, type GetSatelliteImageOutput } from "@/ai/flows/get-satellite-image";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import dynamic from 'next/dynamic';
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";

const MapComponent = dynamic(() => import('@/components/map'), { 
    ssr: false,
    loading: () => <div className="flex items-center justify-center w-full h-full bg-muted"><Loader2 className="w-8 h-8 animate-spin" /></div>
});

const severityColors = {
  low: "border-yellow-500/50 bg-yellow-500/10",
  medium: "border-orange-500/50 bg-orange-500/10",
  high: "border-red-500/50 bg-red-500/10",
};

const MetricDisplay = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string | number }) => (
    <div className="flex items-center">
        <Icon className="h-6 w-6 text-muted-foreground mr-4" />
        <div className="flex-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="font-bold text-lg">{value}</p>
        </div>
    </div>
);

const NutrientDisplay = ({ label, value, color }: { label: string, value: number, color: string }) => (
    <div className="flex items-center gap-2">
        <div className="w-28 shrink-0 text-sm font-semibold">{label}</div>
        <div className="flex-1 bg-muted rounded-full h-2.5">
            <div className={`${color} h-2.5 rounded-full`} style={{ width: `${value}%` }}></div>
        </div>
        <div className="w-12 shrink-0 text-right text-sm font-mono">{value}%</div>
    </div>
);


const MetricSkeleton = () => (
    <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
             <div key={i} className="flex items-center">
                <Skeleton className="h-6 w-6 mr-4 rounded-full" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-5 w-1/2" />
                </div>
            </div>
        ))}
    </div>
);

const CostRow = ({ label, conventional, organic }: { label: string, conventional: number, organic: number }) => (
    <div className="flex justify-between items-center py-2 border-b last:border-none">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className="flex gap-4 font-mono text-sm w-1/2 justify-between">
            <span>₹{conventional.toLocaleString('en-IN')}</span>
            <span>₹{organic.toLocaleString('en-IN')}</span>
        </div>
    </div>
);

export default function DigitalTwinPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<DigitalTwinOutput | null>(null);
  const [satelliteImage, setSatelliteImage] = useState<GetSatelliteImageOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const [markerPosition, setMarkerPosition] = useState<[number, number]>([29.1492, 75.7217]); 
  const [selectedCrop, setSelectedCrop] = useState<string | undefined>(undefined);

  const fetchData = useCallback(async (lat: number, lng: number, crop?: string) => {
    // Only show loading spinner for full data, not just financial refresh
    if (!crop) {
        setIsLoading(true);
        setIsImageLoading(true);
        setError(null);
        setSatelliteImage(null);
        setData(null);
        setSelectedCrop(undefined);

        toast({
            title: t('digitalTwin.analyzingToastTitle'),
            description: `${t('digitalTwin.analyzingToastDesc')} ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        });
    } else {
        // When only changing crop, just update the data object
        toast({ title: "Recalculating...", description: `Fetching financial data for ${crop}.`});
    }

    try {
      const dataPromise = getDigitalTwinData({ latitude: lat, longitude: lng, selectedCrop: crop });
      const imagePromise = crop ? Promise.resolve(satelliteImage) : getSatelliteImage({ latitude: lat, longitude: lng });
      
      const [dataResult, imageResult] = await Promise.all([dataPromise, imagePromise]);
      
      setData(dataResult);

      if (!crop) { // Only update non-financials on initial load
        setSatelliteImage(imageResult);
        if (dataResult.recommendedCrops.length > 0) {
            setSelectedCrop(dataResult.recommendedCrops[0]);
        }
      }
    } catch (err) {
      console.error("Failed to get digital twin data or image", err);
      const errorMessage = t('digitalTwin.errorDesc');
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: t('digitalTwin.errorTitle'),
        description: errorMessage,
      });
      setData(null);
      setSatelliteImage(null);
    } finally {
        setIsLoading(false);
        setIsImageLoading(false);
    }
  }, [t, toast, satelliteImage]);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setMarkerPosition([latitude, longitude]);
        fetchData(latitude, longitude);
      },
      (geoError) => {
        console.warn(`Geolocation Error: ${geoError.message}. Using default location.`);
        fetchData(markerPosition[0], markerPosition[1]);
      }
    );
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCropChange = (crop: string) => {
      setSelectedCrop(crop);
      fetchData(markerPosition[0], markerPosition[1], crop);
  }

  return (
    <>
      <PageHeader
        title={t('nav.digitalTwin')}
        description={t('digitalTwin.pageDescription')}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><MapPinned /> {t('digitalTwin.fieldMapTitle')}</CardTitle>
                        <CardDescription>{t('digitalTwin.fieldMapDescription')}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="aspect-video w-full bg-muted rounded-b-lg flex items-center justify-center relative overflow-hidden">
                            <Suspense fallback={<div className="flex items-center justify-center w-full h-full"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
                                <MapComponent 
                                    markerPosition={markerPosition} 
                                    setMarkerPosition={setMarkerPosition} 
                                    onSetLocation={fetchData}
                                />
                            </Suspense>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Satellite /> {t('digitalTwin.satelliteView')}</CardTitle>
                        <CardDescription>{t('digitalTwin.satelliteViewDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="aspect-video w-full bg-muted rounded-b-lg flex items-center justify-center relative overflow-hidden">
                        {isImageLoading ? <Loader2 className="w-8 h-8 animate-spin" /> : satelliteImage ? (
                            <Image src={satelliteImage.imageUrl} alt="Satellite view of the field" fill className="object-cover" />
                        ) : <p className="text-sm text-destructive">{error || "Could not load image."}</p>}
                        </div>
                    </CardContent>
                </Card>
            </div>
            {(isLoading || data) && (
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2"><Lightbulb /> {t('digitalTwin.bestSuggestion')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? <Skeleton className="h-6 w-full" /> : <p className="text-lg text-foreground">{data!.bestSuggestion}</p>}
                    </CardContent>
                </Card>
            )}
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><DollarSign /> {t('digitalTwin.financialAnalysisTitle')}</CardTitle>
                    <div className="flex items-center gap-2 pt-2">
                         <Select value={selectedCrop} onValueChange={handleCropChange} disabled={!data || data.recommendedCrops.length === 0}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select a crop" />
                            </SelectTrigger>
                            <SelectContent>
                                {data?.recommendedCrops.map(crop => <SelectItem key={crop} value={crop}>{crop}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <CardDescription>Select a crop to see detailed financials.</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading || (data && !data.financialAnalysis) ? <Skeleton className="w-full h-48" /> : data ? (
                        <Tabs defaultValue="conventional">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="conventional">{t('digitalTwin.conventional')}</TabsTrigger>
                                <TabsTrigger value="organic">{t('digitalTwin.organic')}</TabsTrigger>
                            </TabsList>
                            <FinancialAnalysisTabContent type="conventional" analysis={data.financialAnalysis.conventional} risk={data.cropFailureProbability} t={t} />
                            <FinancialAnalysisTabContent type="organic" analysis={data.financialAnalysis.organic} risk={data.cropFailureProbability} t={t} />
                        </Tabs>
                    ) : <p className="text-sm text-destructive">{error}</p>}
                </CardContent>
            </Card>
        </div>
        
        <div className="lg:col-span-1 space-y-6">
            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><TestTube2 /> {t('digitalTwin.soilAnalysis')}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    {isLoading ? <MetricSkeleton /> : data ? (
                        <div className="grid gap-y-4">
                        <MetricDisplay icon={Leaf} label={t('digitalTwin.soilHealth')} value={`${data.soilHealthScore}/100`} />
                        <MetricDisplay icon={Droplets} label={t('digitalTwin.moistureLevel')} value={`${data.moistureLevel}%`} />
                        <MetricDisplay icon={TestTube2} label={t('digitalTwin.soilType')} value={data.soilType} />
                            <div>
                                <p className="text-sm text-muted-foreground">{t('digitalTwin.phLevel')}</p>
                                <p className="font-bold text-lg">{data.phLevel.toFixed(1)}</p>
                            </div>
                            <div className="space-y-3 pt-2">
                                <h4 className="font-semibold text-center md:text-left">{t('digitalTwin.nutrientLevels')}</h4>
                                <NutrientDisplay label="Nitrogen (N)" value={data.nitrogenLevel} color="bg-green-500" />
                                <NutrientDisplay label="Phosphorus (P)" value={data.phosphorusLevel} color="bg-blue-500" />
                                <NutrientDisplay label="Potassium (K)" value={data.potassiumLevel} color="bg-orange-500" />
                            </div>
                        </div>
                    ) : <p className="text-sm text-muted-foreground">{error}</p>}
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Sprout /> {t('digitalTwin.recommendedCrops')}</CardTitle></CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                    {isLoading ? <Skeleton className="w-full h-16" /> : data ? (
                        data.recommendedCrops.map(crop => <div key={crop} className="bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-sm">{crop}</div>)
                    ) : <p className="text-sm text-destructive">{error}</p>}
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle /> {t('digitalTwin.alertsTitle')}</CardTitle></CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-24 w-full" /> : data && (
                        <div className="space-y-4">
                            {data.alerts.length > 0 ? data.alerts.map((alert, index) => (
                            <Alert key={index} className={severityColors[alert.severity]}>
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertTitle className="capitalize">{alert.type.replace(/_/g, ' ')}</AlertTitle>
                                    <AlertDescription>{alert.message}</AlertDescription>
                                </Alert>
                            )) : <p className="text-sm text-muted-foreground">{t('digitalTwin.noAlerts')}</p>}
                        </div>
                    )}
                    {error && !isLoading && <p className="text-sm text-destructive">{error}</p>}
                </CardContent>
            </Card>
        </div>
      </div>
    </>
  );
}

const FinancialAnalysisTabContent = ({ type, analysis, risk, t }: { type: string, analysis: DigitalTwinOutput['financialAnalysis']['conventional'], risk: number, t: any }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <TabsContent value={type} className="pt-4 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                    <p className="text-sm text-muted-foreground">Gross Revenue</p>
                    <p className="font-bold text-lg text-green-600">₹{analysis.grossRevenue.toLocaleString('en-IN')}</p>
                </div>
                 <div>
                    <p className="text-sm text-muted-foreground">Total Costs</p>
                    <p className="font-bold text-lg text-red-600">₹{analysis.totalCosts.toLocaleString('en-IN')}</p>
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">Net Profit</p>
                    <p className="font-bold text-lg">₹{analysis.expectedProfit.toLocaleString('en-IN')}</p>
                </div>
                 <div>
                    <p className="text-sm text-muted-foreground">Return on Investment</p>
                    <p className="font-bold text-lg">{analysis.returnOnInvestment.toFixed(1)}%</p>
                </div>
            </div>

            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <CollapsibleTrigger asChild>
                    <Button variant="link" className="p-0 h-auto">
                        {isOpen ? <Minus className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                        {isOpen ? 'Hide' : 'Show'} Cost Breakdown
                    </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 pt-2 animate-in fade-in-0 zoom-in-95">
                     <Card className="p-4 bg-muted/50">
                        <CostRow label={t('digitalTwin.seedsCost')} conventional={analysis.costBreakdown.seeds} organic={analysis.costBreakdown.seeds} />
                        <CostRow label={t('digitalTwin.fertilizerCost')} conventional={analysis.costBreakdown.fertilizers} organic={analysis.costBreakdown.fertilizers} />
                        <CostRow label="Pesticides Cost" conventional={analysis.costBreakdown.pesticides} organic={analysis.costBreakdown.pesticides} />
                        <CostRow label={t('digitalTwin.irrigationCost')} conventional={analysis.costBreakdown.irrigation} organic={analysis.costBreakdown.irrigation} />
                        <CostRow label="Labor Cost" conventional={analysis.costBreakdown.labor} organic={analysis.costBreakdown.labor} />
                        <CostRow label="Harvesting Cost" conventional={analysis.costBreakdown.harvesting} organic={analysis.costBreakdown.harvesting} />
                    </Card>
                </CollapsibleContent>
            </Collapsible>
            
            <MetricDisplay icon={ShieldAlert} label={t('digitalTwin.cropFailureRisk')} value={`${risk}%`} />
        </TabsContent>
    )
}
