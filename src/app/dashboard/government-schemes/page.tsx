
"use client";

import { useState } from "react";
import AppLayout from "@/components/app-layout";
import PageHeader from "@/components/page-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HandHelping, Tractor, Droplets, Sun, Loader2, CheckCircle2, XCircle, Info, Gift } from "lucide-react";
import { useTranslation } from "@/context/translation-context";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { checkSchemeEligibility, type SchemeEligibilityOutput } from "@/ai/flows/check-scheme-eligibility";
import { useToast } from "@/hooks/use-toast";


interface Scheme {
    titleKey: string;
    descriptionKey: string;
    categoryKey: string;
    icon: React.ElementType;
    ministryKey: string;
    url: string;
}

const schemes: Scheme[] = [
  {
    titleKey: "schemes.pmkisan.title",
    descriptionKey: "schemes.pmkisan.description",
    categoryKey: "schemes.categories.incomeSupport",
    icon: HandHelping,
    ministryKey: "schemes.ministries.agriculture",
    url: "#"
  },
  {
    titleKey: "schemes.subsidy.title",
    descriptionKey: "schemes.subsidy.description",
    categoryKey: "schemes.categories.equipment",
    icon: Tractor,
    ministryKey: "schemes.ministries.agriculture",
    url: "#"
  },
  {
    titleKey: "schemes.pmksy.title",
    descriptionKey: "schemes.pmksy.description",
    categoryKey: "schemes.categories.irrigation",
    icon: Droplets,
    ministryKey: "schemes.ministries.jalShakti",
    url: "#"
  },
  {
    titleKey: "schemes.solar.title",
    descriptionKey: "schemes.solar.description",
    categoryKey: "schemes.categories.energy",
    icon: Sun,
    ministryKey: "schemes.ministries.energy",
    url: "#"
  }
];

const EligibilityDialog = ({ scheme, t, language }: { scheme: Scheme, t: (key: any) => string, language: string }) => {
    const [landSize, setLandSize] = useState("");
    const [income, setIncome] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<SchemeEligibilityOutput | null>(null);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!landSize || !income) {
            toast({
                variant: "destructive",
                title: t('schemes.error.missingTitle'),
                description: t('schemes.error.missingDesc'),
            });
            return;
        }
        setIsLoading(true);
        setResult(null);
        try {
            const res = await checkSchemeEligibility({
                schemeName: t(scheme.titleKey),
                landSizeInAcres: parseFloat(landSize),
                annualIncome: parseFloat(income),
                language,
            });
            setResult(res);
        } catch (error) {
            console.error("Eligibility check failed:", error);
            toast({
                variant: "destructive",
                title: t('schemes.error.apiTitle'),
                description: t('schemes.error.apiDesc'),
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
                <DialogTitle>{t(scheme.titleKey)}</DialogTitle>
                <p className="text-sm text-muted-foreground pt-2">{t('schemes.eligibility.dialogDesc')}</p>
            </DialogHeader>
            {!result ? (
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="land-size">{t('schemes.eligibility.landLabel')}</Label>
                            <Input id="land-size" type="number" placeholder="e.g., 5" value={landSize} onChange={(e) => setLandSize(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="income">{t('schemes.eligibility.incomeLabel')}</Label>
                            <Input id="income" type="number" placeholder="e.g., 80000" value={income} onChange={(e) => setIncome(e.target.value)} />
                        </div>
                    </div>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('schemes.eligibility.checkButton')}
                    </Button>
                </form>
            ) : (
                <div className="py-4 space-y-4">
                    <Alert variant={result.isEligible ? "default" : "destructive"} className={result.isEligible ? "border-green-500/50 bg-green-500/10" : ""}>
                        {result.isEligible ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4" />}
                        <AlertTitle>{result.isEligible ? t('schemes.eligibility.eligibleTitle') : t('schemes.eligibility.notEligibleTitle')}</AlertTitle>
                    </Alert>

                    <Card>
                        <CardHeader className="flex-row gap-3 space-y-0 pb-2">
                            <Info className="h-5 w-5 text-muted-foreground" />
                            <h3 className="font-semibold">{t('schemes.eligibility.reasoningTitle')}</h3>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">{result.reasoning}</p>
                        </CardContent>
                    </Card>

                     <Card>
                        <CardHeader className="flex-row gap-3 space-y-0 pb-2">
                            <Gift className="h-5 w-5 text-muted-foreground" />
                            <h3 className="font-semibold">{t('schemes.eligibility.benefitsTitle')}</h3>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                                {result.benefits.map((benefit, i) => <li key={i}>{benefit}</li>)}
                            </ul>
                        </CardContent>
                    </Card>

                    <Button variant="outline" onClick={() => setResult(null)} className="w-full">{t('schemes.eligibility.checkAnother')}</Button>
                </div>
            )}
        </DialogContent>
    );
}


export default function GovernmentSchemesPage() {
    const { t, language } = useTranslation();

    return (
        <AppLayout>
            <PageHeader
                title={t('nav.governmentSchemes')}
                description={t('schemes.pageHeaderDescription')}
            />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {schemes.map((scheme, index) => {
                    const Icon = scheme.icon;
                    return (
                        <Card key={index} className="flex flex-col">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <CardTitle>{t(scheme.titleKey as any)}</CardTitle>
                                    <Icon className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <CardDescription>{t(scheme.descriptionKey as any)}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <Badge variant="outline">{t(scheme.categoryKey as any)}</Badge>
                            </CardContent>
                            <CardFooter className="flex justify-between items-center">
                                <span className="text-xs text-muted-foreground">{t('schemes.ministry')}: {t(scheme.ministryKey as any)}</span>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button>{t('schemes.eligibility.button')}</Button>
                                    </DialogTrigger>
                                    <EligibilityDialog scheme={scheme} t={t} language={language} />
                                </Dialog>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>
        </AppLayout>
    );
}
