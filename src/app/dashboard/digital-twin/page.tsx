
"use client";

import { useState, useEffect, useMemo } from "react";
import AppLayout from "@/components/app-layout";
import PageHeader from "@/components/page-header";
import { useTranslation } from "@/context/translation-context";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Map, Tractor, Droplets, Wheat, AlertTriangle, Loader2, Save } from "lucide-react";
import { getDigitalTwinData, type DigitalTwinOutput } from "@/ai/flows/digital-twin";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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

const METERS_PER_ACRE = 4046.86;

export default function DigitalTwinPage() {
  const { t } = useTranslation();
  const [selectedField, setSelectedField] = useState<string | null>("field_1");
  const [data, setData] = useState<DigitalTwinOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");

  useEffect(() => {
    if (selectedField) {
      setIsLoading(true);
      getDigitalTwinData({ fieldId: selectedField })
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
    }
  }, [selectedField, toast, t]);

  const handleSaveConfiguration = () => {
    toast({
        title: t('digitalTwin.configSavedTitle'),
        description: `${t('digitalTwin.configSavedDesc')} ${length}m x ${width}m`,
    });
  };

  const calculatedYield = useMemo(() => {
    if (!data) return null;
    const lengthNum = parseFloat(length);
    const widthNum = parseFloat(width);

    if (lengthNum > 0 && widthNum > 0) {
      const areaM2 = lengthNum * widthNum;
      const areaAcres = areaM2 / METERS_PER_ACRE;
      const totalYield = areaAcres * data.expectedYield.value;
      return {
        value: totalYield.toFixed(2),
        unit: "quintals", // The unit is now absolute for the field
      };
    }
    // Default to per-unit value if dimensions are not set
    return {
      value: data.expectedYield.value.toFixed(2),
      unit: data.expectedYield.unit,
    };
  }, [data, length, width]);


  return (
    <AppLayout>
      <PageHeader
        title={t('nav.digitalTwin')}
        description={t('digitalTwin.pageDescription')}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
            {/* Map and Field Selection */}
            <Card>
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

            {/* Field Configuration */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('digitalTwin.configTitle')}</CardTitle>
                    <CardDescription>{t('digitalTwin.configDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label htmlFor="length">{t('digitalTwin.lengthLabel')}</Label>
                        <Input id="length" type="number" placeholder="e.g., 100" value={length} onChange={(e) => setLength(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="width">{t('digitalTwin.widthLabel')}</Label>
                        <Input id="width" type="number" placeholder="e.g., 50" value={width} onChange={(e) => setWidth(e.target.value)} />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleSaveConfiguration} disabled={!length || !width}>
                        <Save className="mr-2 h-4 w-4" />
                        {t('digitalTwin.saveConfigButton')}
                    </Button>
                </CardFooter>
            </Card>
        </div>

        {/* Key Metrics and Alerts */}
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
                           {calculatedYield && <MetricDisplay icon={Wheat} label={t('digitalTwin.expectedYield')} value={`${calculatedYield.value} ${calculatedYield.unit}`} />}
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

    
