
"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import PageHeader from "@/components/page-header";
import { useTranslation } from "@/context/translation-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sprout, AlertTriangle, Loader2, TestTube2, Droplets, Wheat, Leaf, MapPinned, Lightbulb, Satellite } from "lucide-react";
import { getDigitalTwinData, type DigitalTwinOutput } from "@/ai/flows/digital-twin";
import { getSatelliteImage, type GetSatelliteImageOutput } from "@/ai/flows/get-satellite-image";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import dynamic from 'next/dynamic';
import { Skeleton } from "@/components/ui/skeleton";
import { useDebouncedCallback } from 'use-debounce';
import Image from "next/image";

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
        <div className="w-24 shrink-0 text-sm font-semibold">{label}</div>
        <div className="flex-1 bg-muted rounded-full h-2.5">
            <div className={`${color} h-2.5 rounded-full`} style={{ width: `${value}%` }}></div>
        </div>
        <div className="w-12 text-right text-sm font-mono">{value}%</div>
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


export default function DigitalTwinPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<DigitalTwinOutput | null>(null);
  const [satelliteImage, setSatelliteImage] = useState<GetSatelliteImageOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Default to a location in Haryana, India
  const [markerPosition, setMarkerPosition] = useState<[number, number]>([29.1492, 75.7217]); 

  const debouncedFetchData = useDebouncedCallback(async (lat: number, lng: number) => {
    setIsLoading(true);
    setIsImageLoading(true);
    setError(null);
    setSatelliteImage(null);

    try {
      // Fetch both data and image in parallel
      const dataPromise = getDigitalTwinData({ latitude: lat, longitude: lng });
      const imagePromise = getSatelliteImage({ latitude: lat, longitude: lng });
      
      const [dataResult, imageResult] = await Promise.all([dataPromise, imagePromise]);
      
      setData(dataResult);
      setSatelliteImage(imageResult);

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
  }, 1500); // Debounce API calls by 1.5 seconds

  const fetchData = useCallback((lat: number, lng: number) => {
      setIsLoading(true);
      setIsImageLoading(true);
      setError(null);
      debouncedFetchData.cancel(); // Cancel any pending debounced call
      debouncedFetchData(lat, lng);
  }, [debouncedFetchData]);


  useEffect(() => {
    // Initial fetch for the default location
    fetchData(markerPosition[0], markerPosition[1]);
  }, []); // Run only once on mount

  const handleMarkerChange = (newPosition: [number, number]) => {
      setMarkerPosition(newPosition);
      fetchData(newPosition[0], newPosition[1]);
  };
  
  // Get user's current location on mount
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        handleMarkerChange([latitude, longitude]);
      },
      (geoError) => {
        console.warn(`Geolocation Error: ${geoError.message}. Using default location.`);
      }
    );
  }, []);

  return (
    <>
      <PageHeader
        title={t('nav.digitalTwin')}
        description={t('digitalTwin.pageDescription')}
      />
      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><MapPinned /> {t('digitalTwin.fieldMapTitle')}</CardTitle>
                    <CardDescription>{t('digitalTwin.fieldMapDescription')}</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="aspect-video w-full bg-muted rounded-b-lg flex items-center justify-center relative overflow-hidden">
                        <Suspense fallback={<div className="flex items-center justify-center w-full h-full"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
                            <MapComponent markerPosition={markerPosition} setMarkerPosition={handleMarkerChange} />
                        </Suspense>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Satellite /> Sentinel-2 Style View</CardTitle>
                    <CardDescription>{t('digitalTwin.satelliteViewDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="aspect-video w-full bg-muted rounded-b-lg flex items-center justify-center relative overflow-hidden">
                       {isImageLoading ? <Loader2 className="w-8 h-8 animate-spin" /> : satelliteImage ? (
                           <Image src={satelliteImage.imageUrl} alt="Satellite view of the field" fill className="object-cover" />
                       ) : <p className="text-sm text-destructive">{error}</p>}
                    </div>
                </CardContent>
            </Card>
        </div>
        
        {isLoading ? (
            <Card><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
        ) : data && (
            <Card className="bg-primary/5 border-primary/20">
                <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2"><Lightbulb /> {t('digitalTwin.bestSuggestion')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-lg text-foreground">{data.bestSuggestion}</p>
                </CardContent>
            </Card>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="lg:col-span-2">
                <CardHeader><CardTitle className="flex items-center gap-2"><TestTube2 /> {t('digitalTwin.soilAnalysis')}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                     {isLoading ? <MetricSkeleton /> : data ? (
                        <div className="grid md:grid-cols-2 gap-x-6 gap-y-4">
                           <MetricDisplay icon={Leaf} label={t('digitalTwin.soilHealth')} value={`${data.soilHealthScore}/100`} />
                           <MetricDisplay icon={Droplets} label={t('digitalTwin.moistureLevel')} value={`${data.moistureLevel}%`} />
                           <MetricDisplay icon={TestTube2} label={t('digitalTwin.soilType')} value={data.soilType} />
                            <div>
                                <p className="text-sm text-muted-foreground">pH Level</p>
                                <p className="font-bold text-lg">{data.phLevel.toFixed(1)}</p>
                            </div>
                            <div className="space-y-3 pt-2 md:col-span-2">
                                <h4 className="font-semibold text-center md:text-left">Nutrient Levels (% of optimum)</h4>
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
