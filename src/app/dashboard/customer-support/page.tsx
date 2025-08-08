
'use client';

import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Phone, Bot, Info } from 'lucide-react';
import { useTranslation } from '@/context/translation-context';

export default function CustomerSupportPage() {
  const { t } = useTranslation();
  const supportPhoneNumber = "+919876543210"; // A placeholder support number

  return (
    <>
      <PageHeader
        title={t('nav.customerSupport')}
        description={t('customerSupport.pageDescription')}
      />
      <div className="flex justify-center">
        <Card className="w-full max-w-2xl text-center">
          <CardHeader>
             <div className="mx-auto bg-primary/10 rounded-full p-4 w-fit">
                <Bot className="h-12 w-12 text-primary" />
             </div>
            <CardTitle className="mt-4">{t('customerSupport.title')}</CardTitle>
            <CardDescription>{t('customerSupport.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-muted rounded-lg">
                <p className="text-4xl font-bold tracking-wider text-primary">{supportPhoneNumber.replace('+91', '+91 ')}</p>
                <p className="text-sm text-muted-foreground mt-1">{t('customerSupport.callTimings')}</p>
            </div>

            <div className="text-left p-4 border rounded-lg bg-background/50 space-y-2">
                <h3 className="font-semibold flex items-center gap-2"><Info className="h-5 w-5 text-accent"/>{t('customerSupport.whatToExpect.title')}</h3>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>{t('customerSupport.whatToExpect.li1')}</li>
                    <li>{t('customerSupport.whatToExpect.li2')}</li>
                    <li>{t('customerSupport.whatToExpect.li3')}</li>
                </ul>
            </div>
            
            <a href={`tel:${supportPhoneNumber}`}>
                <Button size="lg" className="w-full h-12 text-lg">
                    <Phone className="mr-3 h-6 w-6" />
                    {t('customerSupport.callNowButton')}
                </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

