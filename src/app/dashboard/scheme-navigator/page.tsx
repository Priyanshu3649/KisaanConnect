"use client";

import { useState } from "react";
import AppLayout from "@/components/app-layout";
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Coins, CheckCircle, FileText } from "lucide-react";
import { useTranslation } from "@/context/translation-context";

const schemes = [
    {
        titleKey: "schemes.pmk.title",
        descriptionKey: "schemes.pmk.description",
        eligibilityKeys: [
            "schemes.pmk.e1",
            "schemes.pmk.e2",
            "schemes.pmk.e3",
        ],
        applicationKey: "schemes.pmk.application",
    },
    {
        titleKey: "schemes.pmfby.title",
        descriptionKey: "schemes.pmfby.description",
        eligibilityKeys: [
            "schemes.pmfby.e1",
            "schemes.pmfby.e2",
        ],
        applicationKey: "schemes.pmfby.application",
    },
    {
        titleKey: "schemes.kcc.title",
        descriptionKey: "schemes.kcc.description",
        eligibilityKeys: [
            "schemes.kcc.e1",
            "schemes.kcc.e2",
            "schemes.kcc.e3",
        ],
        applicationKey: "schemes.kcc.application",
    },
    {
        titleKey: "schemes.nmsa.title",
        descriptionKey: "schemes.nmsa.description",
        eligibilityKeys: [
            "schemes.nmsa.e1",
            "schemes.nmsa.e2",
            "schemes.nmsa.e3",
        ],
        applicationKey: "schemes.nmsa.application",
    }
];

export default function SchemeNavigatorPage() {
    const { t } = useTranslation();
    const [selectedScheme, setSelectedScheme] = useState<(typeof schemes)[0] | null>(null);

    return (
        <AppLayout>
            <PageHeader
                title={t('nav.schemeNavigator')}
                description={t('schemes.pageDescription')}
            />
            <div className="space-y-6">
                {schemes.map((scheme, index) => (
                    <Dialog key={index} onOpenChange={(isOpen) => !isOpen && setSelectedScheme(null)}>
                        <Card>
                            <CardHeader>
                                <CardTitle className="font-headline text-xl flex items-start gap-3">
                                    <Coins className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                                    <span>{t(scheme.titleKey as any)}</span>
                                </CardTitle>
                                <CardDescription className="pl-9">{t(scheme.descriptionKey as any)}</CardDescription>
                            </CardHeader>
                            <CardContent className="pl-9 flex gap-4">
                                <DialogTrigger asChild>
                                    <Button variant="outline" onClick={() => setSelectedScheme(scheme)}>
                                        <CheckCircle className="mr-2 h-4 w-4"/>
                                        {t('schemes.checkEligibility')}
                                    </Button>
                                </DialogTrigger>
                            </CardContent>
                        </Card>
                        {selectedScheme && (
                             <DialogContent className="sm:max-w-[625px]">
                                <DialogHeader>
                                    <DialogTitle className="font-headline text-2xl">{t(selectedScheme.titleKey as any)}</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="space-y-2">
                                        <h3 className="font-semibold flex items-center gap-2"><CheckCircle className="h-5 w-5 text-primary"/> {t('schemes.eligibilityCriteria')}</h3>
                                        <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
                                            {selectedScheme.eligibilityKeys.map((item, i) => <li key={i}>{t(item as any)}</li>)}
                                        </ul>
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="font-semibold flex items-center gap-2"><FileText className="h-5 w-5 text-primary"/> {t('schemes.howToApply')}</h3>
                                        <p className="text-muted-foreground">{t(selectedScheme.applicationKey as any)}</p>
                                    </div>
                                </div>
                            </DialogContent>
                        )}
                    </Dialog>
                ))}
            </div>
        </AppLayout>
    );
}
