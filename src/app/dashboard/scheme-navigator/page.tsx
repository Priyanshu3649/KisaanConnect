
"use client";

import { useState } from "react";
import AppLayout from "@/components/app-layout";
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Coins, CheckCircle, FileText } from "lucide-react";

const schemes = [
    {
        title: "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
        description: "A central sector scheme with 100% funding from the Government of India. It provides income support to all landholding farmer families.",
        eligibility: [
            "All landholding farmer families.",
            "Family is defined as husband, wife and minor children.",
            "Must have cultivable land.",
        ],
        application: "Registration is done through the PM-KISAN portal (pmkisan.gov.in) or through Common Service Centres (CSCs). Requires Aadhaar, land records, and bank account details.",
    },
    {
        title: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
        description: "Provides comprehensive insurance coverage against crop failure, helping to stabilize the income of farmers.",
        eligibility: [
            "All farmers including sharecroppers and tenant farmers growing notified crops in notified areas are eligible.",
            "Loanee farmers are enrolled automatically by banks.",
        ],
        application: "Non-loanee farmers can enroll through the National Crop Insurance Portal (NCIP), nearest bank branch, or authorized insurance company.",
    },
    {
        title: "Kisan Credit Card (KCC) Scheme",
        description: "A scheme to provide farmers with timely access to credit for their cultivation and other needs.",
        eligibility: [
            "All farmers – individuals/joint borrowers who are owner cultivators.",
            "Tenant farmers, oral lessees & sharecroppers.",
            "Self Help Groups (SHGs) or Joint Liability Groups (JLGs) of farmers.",
        ],
        application: "Apply at any commercial bank, regional rural bank, or cooperative bank by filling out a simple one-page form. Requires land documents and a passport-sized photograph.",
    },
    {
        title: "National Mission for Sustainable Agriculture (NMSA)",
        description: "Aims to enhance agricultural productivity especially in rainfed areas focusing on integrated farming, water use efficiency, and soil health management.",
        eligibility: [
            "Open to all farmers.",
            "Focus on small and marginal farmers.",
            "Specific components may have additional criteria.",
        ],
        application: "Implemented by State Agriculture Departments. Farmers can contact their local Krishi Vigyan Kendra (KVK) or district agriculture office for details and application forms.",
    }
];

export default function SchemeNavigatorPage() {
    const [selectedScheme, setSelectedScheme] = useState<(typeof schemes)[0] | null>(null);

    return (
        <AppLayout>
            <PageHeader
                title="Scheme Navigator"
                description="Explore government subsidies and check your eligibility."
            />
            <div className="space-y-6">
                {schemes.map((scheme, index) => (
                    <Dialog key={index}>
                        <Card>
                            <CardHeader>
                                <CardTitle className="font-headline text-xl flex items-start gap-3">
                                    <Coins className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                                    <span>{scheme.title}</span>
                                </CardTitle>
                                <CardDescription className="pl-9">{scheme.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="pl-9 flex gap-4">
                                <DialogTrigger asChild>
                                    <Button variant="outline" onClick={() => setSelectedScheme(scheme)}>
                                        <CheckCircle className="mr-2"/>
                                        Check Eligibility
                                    </Button>
                                </DialogTrigger>
                            </CardContent>
                        </Card>
                        {selectedScheme && (
                             <DialogContent className="sm:max-w-[625px]">
                                <DialogHeader>
                                    <DialogTitle className="font-headline text-2xl">{selectedScheme.title}</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="space-y-2">
                                        <h3 className="font-semibold flex items-center gap-2"><CheckCircle className="h-5 w-5 text-primary"/> Eligibility Criteria</h3>
                                        <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
                                            {selectedScheme.eligibility.map((item, i) => <li key={i}>{item}</li>)}
                                        </ul>
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="font-semibold flex items-center gap-2"><FileText className="h-5 w-5 text-primary"/> How to Apply</h3>
                                        <p className="text-muted-foreground">{selectedScheme.application}</p>
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

