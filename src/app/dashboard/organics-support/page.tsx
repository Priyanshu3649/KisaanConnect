import AppLayout from "@/components/app-layout";
import PageHeader from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Check, Leaf, TestTube2, BookOpen } from "lucide-react";
import { useTranslation } from "@/context/translation-context";

const infoCards = [
    {
        titleKey: "organics.certTitle",
        descriptionKey: "organics.certDesc",
        icon: Check
    },
    {
        titleKey: "organics.pesticidesTitle",
        descriptionKey: "organics.pesticidesDesc",
        icon: Leaf
    },
    {
        titleKey: "organics.soilTitle",
        descriptionKey: "organics.soilDesc",
        icon: TestTube2
    },
     {
        titleKey: "organics.marketTitle",
        descriptionKey: "organics.marketDesc",
        icon: BookOpen
    }
];

const faqs = [
    {
        questionKey: "organics.faq1q",
        answerKey: "organics.faq1a"
    },
    {
        questionKey: "organics.faq2q",
        answerKey: "organics.faq2a"
    },
    {
        questionKey: "organics.faq3q",
        answerKey: "organics.faq3a"
    },
    {
        questionKey: "organics.faq4q",
        answerKey: "organics.faq4a"
    }
];

export default function OrganicsSupportPage() {
  const { t } = useTranslation();
  return (
    <AppLayout>
      <PageHeader
        title={t('nav.organicsSupport')}
        description={t('organics.pageDescription')}
      />
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {infoCards.map((card, index) => (
            <Card key={index} className="flex flex-col">
                <CardHeader className="flex-row gap-4 items-center">
                    <card.icon className="h-8 w-8 text-primary" />
                    <div>
                        <CardTitle className="font-headline text-xl">{t(card.titleKey as any)}</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow">
                     <p className="text-muted-foreground">{t(card.descriptionKey as any)}</p>
                </CardContent>
            </Card>
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader>
            <CardTitle>{t('organics.faqTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
            <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                    <AccordionItem value={`item-${index}`} key={index}>
                        <AccordionTrigger className="font-semibold text-left">{t(faq.questionKey as any)}</AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                            {t(faq.answerKey as any)}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
