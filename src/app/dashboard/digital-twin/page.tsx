
"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import PageHeader from "@/components/page-header";
import { useTranslation } from "@/context/translation-context";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tractor, Droplets, Wheat, AlertTriangle, Loader2, Save, Pin, MapPinned, Sprout, TestTube2, Lightbulb } from "lucide-react";
import { getDigitalTwinData, type DigitalTwinOutput } from "@/ai/flows/digital-twin";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import dynamic from 'next/dynamic';
import { useDebouncedCallback } from "use-debounce";
import { Skeleton } from "@/components/ui/skeleton";

const MapComponent = dynamic(() => import('@/components/map'), { 
    ssr: false,
    loading: () => <div className="flex items-center justify-center w-full h-full bg-muted"><Loader2 className="w-8 h-8 animate-spin" /></div>
});

const severityColors = {
  low: "bg-yellow-500 text-yellow-900",
  medium: "bg-orange-500 text-orange-900",
  high: "bg-red-500 text-red-100",
};
const severityBorderColors = {
  low: "border-yellow-500/50",
  medium: "border-orange-500/50",
  high: "border-red-500/50",
};


export default function DigitalTwinPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<DigitalTwinOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [markerPosition, setMarkerPosition] = useState<[number, number]>([28.9959, 77.0178]); // Default to Sonipat, Haryana

  const debouncedFetchData = useDebouncedCallback((lat: number, lon: number) => {
    setIsLoading(true);
    setData(null); // Clear old data
    getDigitalTwinData({ latitude: lat, longitude: lon })
        .then(setData)
        .catch(err => {
          console.error("Failed to get digital twin data", err);
          toast({
            variant: "destructive",
            title: t('digitalTwin.errorTitle'),
            description: t('digitalTwin.errorDesc'),
          });
        })
        .finally(() => setIsLoading(false));
  }, 1000); // 1-second debounce after user stops moving the pin

  useEffect(() => {
    if (markerPosition) {
        debouncedFetchData(markerPosition[0], markerPosition[1]);
    }
  }, [markerPosition, debouncedFetchData]);
  

  const handleSetLocation = () => {
    toast({
        title: "Analysis Triggered",
        description: `Fetching new digital twin data for coordinates: ${markerPosition[0].toFixed(4)}, ${markerPosition[1].toFixed(4)}`,
    });
    // The useEffect hook will automatically call the debounced fetch function
  };

  return (
    <>
      <PageHeader
        title={t('nav.digitalTwin')}
        description={t('digitalTwin.pageDescription')}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><MapPinned /> {t('digitalTwin.fieldMapTitle')}</CardTitle>
                    <CardDescription>{t('digitalTwin.fieldMapDescription')}</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="aspect-video w-full bg-muted rounded-b-lg flex items-center justify-center relative overflow-hidden">
                       <MapComponent markerPosition={markerPosition} setMarkerPosition={setMarkerPosition} />
                    </div>
                </CardContent>
                 <CardFooter className="flex justify-end pt-4">
                    <Button onClick={handleSetLocation}>
                        <Pin className="mr-2 h-4 w-4" />
                        Analyze this Location
                    </Button>
                </CardFooter>
            </Card>

            {isLoading ? (
                <Card><CardContent className="p-6"><Skeleton className="h-40 w-full" /></CardContent></Card>
            ) : data && (
                <>
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Lightbulb /> Best Suggestion</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg text-foreground">{data.bestSuggestion}</p>
                    </CardContent>
                </Card>

                <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><Sprout /> Recommended Crops</CardTitle></CardHeader>
                        <CardContent className="flex flex-wrap gap-2">
                           {data.recommendedCrops.map(crop => <div key={crop} className="bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-sm">{crop}</div>)}
                        </CardContent>
                    </Card>
                    <Card>
                         <CardHeader><CardTitle className="flex items-center gap-2"><Wheat /> Yield Forecast</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                            {data.yieldForecast.map(forecast => (
                                <div key={forecast.crop} className="flex justify-between text-sm">
                                    <span>{forecast.crop}</span>
                                    <span className="font-semibold">{forecast.value} {forecast.unit}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
                </>
            )}
        </div>

        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>{t('digitalTwin.keyMetricsTitle')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     {isLoading ? <MetricSkeleton count={3} /> : data && (
                        <>
                           <MetricDisplay icon={Tractor} label={t('digitalTwin.soilHealth')} value={`${data.soilHealthScore}/100`} />
                           <MetricDisplay icon={Droplets} label={t('digitalTwin.moistureLevel')} value={`${data.moistureLevel}%`} />
                           <MetricDisplay icon={TestTube2} label="Soil Type" value={data.soilType} />
                        </>
                     )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t('digitalTwin.alertsTitle')}</CardTitle>
                    <CardDescription>Live Farm Updates</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? <MetricSkeleton count={2} /> : data && (
                        <div className="space-y-4">
                            {data.alerts.length > 0 ? data.alerts.map((alert, index) => (
                               <Alert key={index} className={severityBorderColors[alert.severity]}>
                                    <div className={`h-5 w-5 rounded-full ${severityColors[alert.severity]} flex items-center justify-center mr-2`}>
                                        <AlertTriangle className="h-3 w-3" />
                                    </div>
                                    <AlertTitle className="capitalize">{alert.type.replace(/_/g, ' ')}</AlertTitle>
                                    <AlertDescription>
                                        {alert.message}
                                    </AlertDescription>
                                </Alert>
                            )) : <p className="text-sm text-muted-foreground">{t('digitalTwin.noAlerts')}</p>}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </>
  );
}

const MetricDisplay = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string }) => (
    <div className="flex items-center">
        <Icon className="h-6 w-6 text-muted-foreground mr-4" />
        <div className="flex-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="font-bold text-lg">{value}</p>
        </div>
    </div>
);

const MetricSkeleton = ({ count }: { count: number }) => (
    <div className="space-y-4">
        {Array.from({ length: count }).map((_, i) => (
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
