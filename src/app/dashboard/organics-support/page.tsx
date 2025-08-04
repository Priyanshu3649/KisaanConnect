import Image from "next/image";
import AppLayout from "@/components/app-layout";
import PageHeader from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Check, Leaf, TestTube2, BookOpen } from "lucide-react";

const infoCards = [
    {
        title: "Certification Process",
        description: "Step-by-step guide to getting your farm certified as organic.",
        icon: Check,
        image: "https://placehold.co/600x400.png",
        hint: "certificate document"
    },
    {
        title: "Natural Pesticides",
        description: "Learn how to create and use effective, all-natural pesticides.",
        icon: Leaf,
        image: "https://placehold.co/600x400.png",
        hint: "spraying crops"
    },
    {
        title: "Soil Health",
        description: "Techniques for composting and improving soil fertility without chemicals.",
        icon: TestTube2,
        image: "https://placehold.co/600x400.png",
        hint: "healthy soil"
    },
     {
        title: "Organic Marketplaces",
        description: "Find buyers and markets specifically looking for organic produce.",
        icon: BookOpen,
        image: "https://placehold.co/600x400.png",
        hint: "farmers market"
    }
];

const faqs = [
    {
        question: "How long does the transition to organic farming take?",
        answer: "The transition period, also known as the conversion period, typically takes two to three years, depending on the crop and past use of the land. During this time, you must follow organic practices, but your crops cannot be sold as 'certified organic'."
    },
    {
        question: "What are the main challenges of organic farming?",
        answer: "Key challenges include managing pests and weeds without synthetic chemicals, lower initial yields during the transition period, and potentially higher labor costs. However, organic produce often commands higher prices in the market."
    },
    {
        question: "Can I use cow dung as fertilizer?",
        answer: "Yes, composted cow dung is an excellent organic fertilizer. Raw manure should be composted for at least 3-4 months before application to kill pathogens and weed seeds."
    },
    {
        question: "What is crop rotation and why is it important?",
        answer: "Crop rotation is the practice of growing different types of crops in the same area in sequential seasons. It is crucial for managing soil fertility, reducing soil erosion, and helping to control pests and diseases."
    }
];

export default function OrganicsSupportPage() {
  return (
    <AppLayout>
      <PageHeader
        title="Organics Support"
        description="Resources to help you transition to and succeed in organic farming."
      />
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {infoCards.map((card, index) => (
            <Card key={index} className="flex flex-col">
                <CardHeader className="flex-row gap-4 items-center">
                    <card.icon className="h-8 w-8 text-primary" />
                    <div>
                        <CardTitle className="font-headline text-xl">{card.title}</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow">
                     <p className="text-muted-foreground">{card.description}</p>
                </CardContent>
            </Card>
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
            <CardDescription>Common questions about organic farming.</CardDescription>
        </CardHeader>
        <CardContent>
            <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                    <AccordionItem value={`item-${index}`} key={index}>
                        <AccordionTrigger className="font-semibold">{faq.question}</AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                            {faq.answer}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
