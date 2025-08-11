"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import PageHeader from "@/components/page-header";
import { useTranslation } from "@/context/translation-context";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tractor, Droplets, Wheat, AlertTriangle, Loader2, Save, Pin, MapPinned, Sprout, TestTube2, Lightbulb, PlusCircle, Edit, Trash2, Square, RectangleHorizontal,LayoutPanelLeft, View, LocateFixed, Beaker } from "lucide-react";
import { getDigitalTwinData, type DigitalTwinOutput } from "@/ai/flows/digital-twin";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import dynamic from 'next/dynamic';
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Progress } from "@/components/ui/progress";
import { useDebouncedCallback } from 'use-debounce';

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

type FieldShape = 'rectangle' | 'square' | 'trapezium' | 'parallelogram';
interface Field {
    id: string;
    name: string;
    location: { lat: number; lng: number };
    shape: FieldShape;
    measurements: Record<string, number | undefined>;
    area: number;
}

const initialFields: Field[] = [{
    id: 'field1',
    name: 'North Field',
    location: { lat: 28.9959, lng: 77.0178 },
    shape: 'rectangle',
    measurements: { length: 200, width: 100 },
    area: 20000,
}];


export default function DigitalTwinPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<DigitalTwinOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  const [fields, setFields] = useState<Field[]>(initialFields);
  const [selectedField, setSelectedField] = useState<Field | null>(fields.length > 0 ? fields[0] : null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingField, setEditingField] = useState<Partial<Field> | null>(null);
  const [isLocating, setIsLocating] = useState(false);


  const fetchDataForField = useCallback(async (field: Field) => {
    setIsLoading(true);
    setData(null);
    try {
        const result = await getDigitalTwinData({ latitude: field.location.lat, longitude: field.location.lng });
        setData(result);
    } catch (err) {
        console.error("Failed to get digital twin data", err);
        toast({
            variant: "destructive",
            title: t('digitalTwin.errorTitle'),
            description: t('digitalTwin.errorDesc'),
        });
    } finally {
        setIsLoading(false);
    }
  }, [toast, t]);

  const debouncedFetchData = useDebouncedCallback((field: Field) => {
    fetchDataForField(field);
  }, 1000); // 1-second debounce

  useEffect(() => {
    if (selectedField) {
        fetchDataForField(selectedField);
    } else {
        setIsLoading(false);
        setData(null);
    }
  }, [selectedField?.id]); // Only refetch when the selected field ID changes
  
  const handleSelectField = (fieldId: string) => {
    const field = fields.find(f => f.id === fieldId);
    if (field) {
        setSelectedField(field);
    }
  };
  
  const handleAddNewField = () => {
    setEditingField({
        id: `field_${Date.now()}`,
        name: '',
        location: { lat: 28.9959, lng: 77.0178 }, // Default location
        shape: 'rectangle',
        measurements: {},
        area: 0,
    });
    setIsFormOpen(true);
  };
  
  const handleEditField = (field: Field) => {
    setEditingField(JSON.parse(JSON.stringify(field))); // Deep copy
    setIsFormOpen(true);
  };
  
  const handleDeleteField = (fieldId: string) => {
    setFields(prev => {
        const newFields = prev.filter(f => f.id !== fieldId);
        if(selectedField?.id === fieldId) {
            setSelectedField(newFields.length > 0 ? newFields[0] : null);
        }
        return newFields;
    });
    toast({ title: t('digitalTwin.fieldDeleted') });
  };
  
  const handleSaveField = (fieldData: Field) => {
    let newSelectedField = fieldData;
    setFields(prev => {
        const index = prev.findIndex(f => f.id === fieldData.id);
        if (index > -1) {
            const newFields = [...prev];
            newFields[index] = fieldData;
            return newFields;
        }
        // If it's a new field, it's already selected
        return [...prev, fieldData];
    });
    setSelectedField(newSelectedField);
    setIsFormOpen(false);
    setEditingField(null);
    toast({ title: t('digitalTwin.fieldSaved') });
  };

  const handleSetFieldLocation = useCallback((lat: number, lng: number) => {
    if (selectedField) {
        const updatedField = { ...selectedField, location: { lat, lng } };
        // Update the state for the selected field.
        setSelectedField(updatedField);
        // Also update the list of all fields.
        setFields(prev => prev.map(f => f.id === updatedField.id ? updatedField : f));
        // Trigger debounced data fetch
        debouncedFetchData(updatedField);
    }
  }, [selectedField, debouncedFetchData]);
  
  const handleGetCurrentLocation = () => {
        if (!selectedField) {
            toast({ variant: 'destructive', title: t('digitalTwin.noFieldSelectedTitle'), description: t('digitalTwin.noFieldSelectedDesc')});
            return;
        }
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                handleSetFieldLocation(latitude, longitude);
                setIsLocating(false);
                toast({ title: t('digitalTwin.locationUpdatedTitle'), description: t('digitalTwin.locationUpdatedDesc')});
            },
            (error) => {
                setIsLocating(false);
                toast({ variant: 'destructive', title: t('digitalTwin.locationErrorTitle'), description: t('digitalTwin.locationErrorDesc')});
            }
        );
  };

  if (!selectedField && fields.length === 0 && !isLoading) {
      return (
          <>
          <PageHeader
            title={t('nav.digitalTwin')}
            description={t('digitalTwin.pageDescription')}
          />
          <Card className="text-center py-12">
            <CardHeader>
                <CardTitle>{t('digitalTwin.noFieldsTitle')}</CardTitle>
                <CardDescription>{t('digitalTwin.noFieldsDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
                 <Button onClick={handleAddNewField}>
                    <PlusCircle className="mr-2 h-4 w-4" /> {t('digitalTwin.addNewField')}
                </Button>
            </CardContent>
          </Card>
          <FieldFormDialog
            isOpen={isFormOpen}
            onOpenChange={setIsFormOpen}
            onSave={handleSaveField}
            fieldData={editingField}
           />
         </>
      )
  }
  

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
                    <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2"><MapPinned /> {selectedField?.name || t('digitalTwin.fieldMap')}</div>
                        <Button size="sm" variant="outline" onClick={handleGetCurrentLocation} disabled={isLocating || !selectedField}>
                            {isLocating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LocateFixed className="mr-2 h-4 w-4" />}
                            {t('digitalTwin.useCurrentLocation')}
                        </Button>
                    </CardTitle>
                    <CardDescription>{t('digitalTwin.fieldMapDescription')}</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="aspect-video w-full bg-muted rounded-b-lg flex items-center justify-center relative overflow-hidden">
                       {selectedField ? (
                            <MapComponent 
                                key={selectedField.id} // Re-mount map if field changes
                                markerPosition={[selectedField.location.lat, selectedField.location.lng]} 
                                setMarkerPosition={([lat, lng]) => handleSetFieldLocation(lat, lng)}
                            />
                       ) : <p>{t('digitalTwin.selectField')}</p>}
                    </div>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><View /> {t('digitalTwin.satelliteView')}</CardTitle>
                        <CardDescription>{t('digitalTwin.satelliteViewDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <Skeleton className="aspect-video w-full" />
                        ) : (
                            <SatelliteView healthScore={data?.soilHealthScore || 0} />
                        )}
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><TestTube2 /> {t('digitalTwin.soilAnalysis')}</CardTitle>
                        <CardDescription>{t('digitalTwin.soilAnalysisDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {isLoading ? <MetricSkeleton count={4} /> : data && (
                            <>
                                <NutrientProgress label="Nitrogen (N)" value={data.nitrogenLevel} />
                                <NutrientProgress label="Phosphorus (P)" value={data.phosphorusLevel} />
                                <NutrientProgress label="Potassium (K)" value={data.potassiumLevel} />
                                <MetricDisplay icon={Beaker} label="Soil pH" value={data.phLevel.toFixed(1)} />
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {isLoading ? (
                <Card><CardContent className="p-6"><Skeleton className="h-40 w-full" /></CardContent></Card>
            ) : data && (
                <>
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Lightbulb /> {t('digitalTwin.bestSuggestion')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg text-foreground">{data.bestSuggestion}</p>
                    </CardContent>
                </Card>

                <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><Sprout /> {t('digitalTwin.recommendedCrops')}</CardTitle></CardHeader>
                        <CardContent className="flex flex-wrap gap-2">
                           {data.recommendedCrops.map(crop => <div key={crop} className="bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-sm">{crop}</div>)}
                        </CardContent>
                    </Card>
                    <Card>
                         <CardHeader><CardTitle className="flex items-center gap-2"><Wheat /> {t('digitalTwin.yieldForecast')}</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                            {data.yieldForecast.map(forecast => (
                                <div key={forecast.crop} className="flex justify-between text-sm">
                                    <span>{forecast.crop}</span>
                                    {selectedField && selectedField.area > 0 ? (
                                        <span className="font-semibold">{ (selectedField.area * (forecast.value / 4046.86)).toFixed(2) } {t('digitalTwin.quintalTotal')}</span>
                                    ) : (
                                        <span className="font-semibold">{forecast.value} {forecast.unit}</span>
                                    )}
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
                    <CardTitle>{t('digitalTwin.myFields')}</CardTitle>
                    <CardDescription>{t('digitalTwin.myFieldsDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    {fields.map(field => (
                        <div key={field.id} onClick={() => handleSelectField(field.id)} className={cn("flex items-center justify-between p-2 rounded-lg cursor-pointer", selectedField?.id === field.id ? 'bg-secondary' : 'hover:bg-muted/50')}>
                            <div>
                                <p className="font-semibold">{field.name}</p>
                                <p className="text-xs text-muted-foreground">{field.area.toFixed(0)} m²</p>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => {e.stopPropagation(); handleEditField(field)}}><Edit className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={(e) => {e.stopPropagation(); handleDeleteField(field.id)}}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    ))}
                     <Button onClick={handleAddNewField} variant="outline" className="w-full mt-2">
                        <PlusCircle className="mr-2 h-4 w-4" /> {t('digitalTwin.addNewField')}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t('digitalTwin.keyMetricsTitle')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     {isLoading ? <MetricSkeleton count={3} /> : data && (
                        <>
                           <MetricDisplay icon={Tractor} label={t('digitalTwin.soilHealth')} value={`${data.soilHealthScore}/100`} />
                           <MetricDisplay icon={Droplets} label={t('digitalTwin.moistureLevel')} value={`${data.moistureLevel}%`} />
                           <MetricDisplay icon={TestTube2} label={t('digitalTwin.soilType')} value={data.soilType} />
                        </>
                     )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t('digitalTwin.alertsTitle')}</CardTitle>
                    <CardDescription>{t('digitalTwin.alertsDesc')}</CardDescription>
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
      <FieldFormDialog
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleSaveField}
        fieldData={editingField}
        t={t}
      />
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

const NutrientProgress = ({ label, value }: { label: string, value: number }) => {
    const { t } = useTranslation();
    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <p className="text-sm text-muted-foreground">{label}</p>
                <span className="text-xs font-semibold">{value}% {t('digitalTwin.ofOptimum')}</span>
            </div>
            <Progress value={value} />
        </div>
    )
};

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


// Form Dialog Component
const FieldFormDialog = ({ isOpen, onOpenChange, onSave, fieldData, t }: { isOpen: boolean, onOpenChange: (open: boolean) => void, onSave: (data: Field) => void, fieldData: Partial<Field> | null, t: any }) => {
    const [field, setField] = useState<Partial<Field> | null>(null);

    useEffect(() => {
        if (fieldData) {
            setField(fieldData);
        } else if (isOpen) { // Reset only when opening for a new field
            setField({
                location: { lat: 28.9959, lng: 77.0178 },
                shape: 'rectangle',
                measurements: {},
            });
        }
    }, [fieldData, isOpen]);

    const handleMeasurementChange = (key: string, value: string) => {
        setField(prev => (prev ? {...prev, measurements: {...prev?.measurements, [key]: parseFloat(value) || undefined}} : null));
    };

    const calculatedArea = useMemo(() => {
        if (!field || !field.shape || !field.measurements) return 0;
        const m = field.measurements;
        switch(field.shape) {
            case 'rectangle': return (m.length || 0) * (m.width || 0);
            case 'square': return (m.side || 0) * (m.side || 0);
            case 'trapezium': return (((m.base1 || 0) + (m.base2 || 0)) / 2) * (m.height || 0);
            case 'parallelogram': return (m.base || 0) * (m.height || 0);
            default: return 0;
        }
    }, [field]);
    
    const handleSave = () => {
        if (field && field.name) {
            onSave({ ...field, area: calculatedArea } as Field);
        }
    };
    
    const shapeFields: Record<FieldShape, {key: string, label: string}[]> = {
        rectangle: [{key: 'length', label: t('digitalTwin.lengthLabel')}, {key: 'width', label: t('digitalTwin.widthLabel')}],
        square: [{key: 'side', label: t('digitalTwin.sideLabel')}],
        trapezium: [{key: 'base1', label: t('digitalTwin.base1Label')}, {key: 'base2', label: t('digitalTwin.base2Label')}, {key: 'height', label: t('digitalTwin.heightLabel')}],
        parallelogram: [{key: 'base', label: t('digitalTwin.baseLabel')}, {key: 'height', label: t('digitalTwin.heightLabel')}],
    };

    if (!field) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{field.id?.startsWith('field_') ? t('digitalTwin.addNewField') : t('digitalTwin.editField')}</DialogTitle>
                    <DialogDescription>{t('digitalTwin.dialogDesc')}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>{t('digitalTwin.fieldLocation')}</Label>
                        <div className="aspect-video w-full bg-muted rounded-lg relative overflow-hidden">
                            <MapComponent 
                                markerPosition={[field.location?.lat || 28.9959, field.location?.lng || 77.0178]} 
                                setMarkerPosition={([lat, lng]) => setField(prev => prev ? ({...prev, location: {lat, lng}}) : null)}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="field-name">{t('digitalTwin.fieldName')}</Label>
                        <Input id="field-name" value={field.name || ''} onChange={(e) => setField(prev => prev ? ({...prev, name: e.target.value}) : null)} placeholder={t('digitalTwin.fieldNamePlaceholder')} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="field-shape">{t('digitalTwin.fieldShape')}</Label>
                        <Select value={field.shape} onValueChange={(v: FieldShape) => setField(prev => prev ? ({...prev, shape: v, measurements: {}}) : null)}>
                            <SelectTrigger id="field-shape">
                                <SelectValue placeholder={t('digitalTwin.selectShape')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="rectangle"><div className="flex items-center gap-2"><RectangleHorizontal className="h-4 w-4" /> {t('digitalTwin.rectangle')}</div></SelectItem>
                                <SelectItem value="square"><div className="flex items-center gap-2"><Square className="h-4 w-4" /> {t('digitalTwin.square')}</div></SelectItem>
                                <SelectItem value="trapezium"><div className="flex items-center gap-2"><LayoutPanelLeft className="h-4 w-4" /> {t('digitalTwin.trapezium')}</div></SelectItem>
                                <SelectItem value="parallelogram"><div className="flex items-center gap-2"><LayoutPanelLeft className="h-4 w-4" /> {t('digitalTwin.parallelogram')}</div></SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                         {shapeFields[field.shape as FieldShape].map(f => (
                             <div className="space-y-2" key={f.key}>
                                 <Label htmlFor={f.key}>{f.label}</Label>
                                 <Input id={f.key} type="number" value={field.measurements?.[f.key] || ''} onChange={(e) => handleMeasurementChange(f.key, e.target.value)} />
                             </div>
                         ))}
                    </div>
                    <div>
                        <Label>{t('digitalTwin.calculatedArea')}</Label>
                        <p className="font-bold text-lg">{calculatedArea.toFixed(2)} m²</p>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSave} disabled={!field.name}>
                        <Save className="mr-2 h-4 w-4" /> {t('digitalTwin.saveField')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const SatelliteView = ({ healthScore }: { healthScore: number }) => {
    const grid = useMemo(() => {
        const dots = [];
        const healthThreshold = healthScore / 100; // 0 to 1
        for(let i = 0; i < 100; i++) {
            const randomValue = Math.random();
            let color = 'bg-green-500/80'; // Healthy
            if(randomValue > healthThreshold) {
                // Unhealthy dot, color depends on how far it is from threshold
                if (randomValue > healthThreshold + 0.2) {
                    color = 'bg-red-500/80'; // Very unhealthy
                } else {
                    color = 'bg-yellow-500/80'; // Moderately unhealthy
                }
            }
            dots.push({ id: i, color });
        }
        return dots;
    }, [healthScore]);

    return (
        <div className="aspect-video w-full rounded-lg flex items-center justify-center relative overflow-hidden border">
            <Image
                src="https://placehold.co/600x400.png"
                alt="Satellite view of a farm field"
                data-ai-hint="satellite farm field"
                fill
                className="object-cover"
            />
            <div 
                className="absolute inset-0 grid grid-cols-10 grid-rows-10"
            >
                {grid.map(dot => (
                    <div 
                        key={dot.id} 
                        className={cn(
                            "w-full h-full transition-colors duration-500 mix-blend-multiply", 
                            dot.color
                        )}
                        style={{
                            animation: `pulse 3s infinite ease-in-out ${Math.random() * 3}s`
                        }}
                    ></div>
                ))}
            </div>
             <style jsx>{`
                @keyframes pulse {
                    0%, 100% {
                        opacity: 0.7;
                    }
                    50% {
                        opacity: 0.4;
                    }
                }
            `}</style>
        </div>
    );
};
