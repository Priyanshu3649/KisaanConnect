"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/app-layout";
import PageHeader from "@/components/page-header";
import { useTranslation } from "@/context/translation-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Map, Tractor, Droplets, Wheat, AlertTriangle, Loader2 } from "lucide-react";
import { getDigitalTwinData, type DigitalTwinOutput } from "@/ai/flows/digital-twin";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

const severityColors = {
  low: "bg-yellow-500",
  medium: "bg-orange-500",
  high: "bg-red-500",
};
const severityBorderColors = {
  low: "border-yellow-500/50",
  medium: "border-orange-500/50",
  high: "border-red-500/50",
};

export default function DigitalTwinPage() {
  const { t } = useTranslation();
  const [selectedField, setSelectedField] = useState<string | null>("field_1");
  const [data, setData] = useState<DigitalTwinOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (selectedField) {
      setIsLoading(true);
      getDigitalTwinData({ fieldId: selectedField })
        .then(setData)
        .catch(err => {
          console.error("Failed to get digital twin data", err);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Could not load field data. Please try again later.",
          });
        })
        .finally(() => setIsLoading(false));
    }
  }, [selectedField, toast]);

  return (
    <AppLayout>
      <PageHeader
        title={t('nav.digitalTwin')}
        description={t('digitalTwin.pageDescription')}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Map and Field Selection */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('digitalTwin.fieldMapTitle')}</CardTitle>
            <CardDescription>{t('digitalTwin.fieldMapDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="aspect-video w-full bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
                {/* This is a placeholder for a real map component */}
                 <img src="https://placehold.co/800x450.png" alt="Map of fields" className="w-full h-full object-cover" data-ai-hint="map farm" />
                 <div className="absolute inset-0 bg-black/20"></div>
                
                 {/* Simulated Field Polygons */}
                 <div 
                    className={`absolute w-1/3 h-1/2 top-4 left-4 border-2 cursor-pointer transition-all duration-300 ${selectedField === 'field_1' ? 'bg-primary/50 border-primary' : 'bg-white/30 border-white hover:bg-primary/30'}`}
                    onClick={() => setSelectedField('field_1')}
                 >
                    <span className="absolute bottom-1 right-1 text-white text-xs bg-black/50 px-1 rounded-sm">Field 1</span>
                </div>
                 <div 
                    className={`absolute w-1/2 h-1/3 bottom-4 right-4 border-2 cursor-pointer transition-all duration-300 ${selectedField === 'field_2' ? 'bg-primary/50 border-primary' : 'bg-white/30 border-white hover:bg-primary/30'}`}
                    onClick={() => setSelectedField('field_2')}
                 >
                    <span className="absolute bottom-1 right-1 text-white text-xs bg-black/50 px-1 rounded-sm">Field 2</span>
                 </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>{t('digitalTwin.keyMetricsTitle')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     {isLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : data && (
                        <>
                           <MetricDisplay icon={Tractor} label={t('digitalTwin.soilHealth')} value={`${data.soilHealthScore}/100`} />
                           <MetricDisplay icon={Droplets} label={t('digitalTwin.moistureLevel')} value={`${data.moistureLevel}%`} />
                           <MetricDisplay icon={Wheat} label={t('digitalTwin.expectedYield')} value={`${data.expectedYield.value} ${data.expectedYield.unit}`} />
                        </>
                     )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t('digitalTwin.alertsTitle')}</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : data && (
                        <div className="space-y-4">
                            {data.alerts.length > 0 ? data.alerts.map((alert, index) => (
                               <Alert key={index} className={severityBorderColors[alert.severity]}>
                                    <AlertTriangle className={`h-4 w-4 ${severityColors[alert.severity].replace('bg-', 'text-')}`} />
                                    <AlertTitle className="capitalize">{alert.type.replace('_', ' ')}</AlertTitle>
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
    </AppLayout>
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
)
