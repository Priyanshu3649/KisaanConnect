
"use client";

import AppLayout from "@/components/app-layout";
import PageHeader from "@/components/page-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HandHelping, Tractor, Droplets, Sun } from "lucide-react";
import { useTranslation } from "@/context/translation-context";
import Link from "next/link";

const schemes = [
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

export default function GovernmentSchemesPage() {
    const { t } = useTranslation();

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
                                <Link href={scheme.url} passHref>
                                    <Button variant="outline" asChild>
                                      <a>{t('schemes.learnMore')}</a>
                                    </Button>
                                </Link>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>
        </AppLayout>
    );
}
