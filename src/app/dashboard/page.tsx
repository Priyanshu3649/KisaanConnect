
"use client";

import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import PageHeader from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Tractor, Wheat, Sun, Cloud, Thermometer, Loader2, CloudSun, CloudRain, CloudFog, CloudSnow, CloudLightning, ArrowUp, Share2, ShieldCheck, Star, BadgeCheck, Lightbulb, Banknote, Leaf } from "lucide-react";
import EarningsChart from "./earnings-chart";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/context/translation-context";
import { getWeather, type GetWeatherOutput } from "@/ai/flows/get-weather";
import { getAgriCreditScore, type AgriCreditScoreOutput } from "@/ai/flows/agri-credit-score";
import { getDashboardAnalytics, type DashboardAnalyticsOutput } from "@/ai/flows/dashboard-analytics";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import { format } from 'date-fns';

interface UserData {
  name?: string;
  location?: string;
  email?: string;
}

interface Diagnosis {
    id: string;
    createdAt: { seconds: number; nanoseconds: number; };
    result: {
        plantName: string;
        diseaseName: string;
        isHealthy: boolean;
    }
}


const StatCardSkeleton = () => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-5 w-2/4" />
            <Skeleton className="h-4 w-4 rounded-full" />
        </CardHeader>
        <CardContent>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-2/4" />
        </CardContent>
    </Card>
);

const WeatherIcon = ({ iconName, ...props }: { iconName: GetWeatherOutput['current']['icon'], [key: string]: any }) => {
    const icons: { [key: string]: React.ElementType } = {
        Sun, Cloud, CloudSun, CloudRain, CloudFog, CloudSnow, CloudLightning
    };
    const Icon = icons[iconName] || Sun;
    return <Icon {...props} />;
};

const BadgeIcon = ({ iconName, ...props }: { iconName: "Tractor" | "ShieldCheck" | "Star" | "BadgeCheck", [key: string]: any }) => {
    const icons: { [key: string]: React.ElementType } = {
        Tractor, ShieldCheck, Star, BadgeCheck
    };
    const Icon = icons[iconName] || Star;
    return <Icon {...props} />;
};

export default function DashboardPage() {
  const [user, authLoading] = useAuthState(auth);
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [analyticsData, setAnalyticsData] = useState<DashboardAnalyticsOutput | null>(null);
  const [weatherData, setWeatherData] = useState<GetWeatherOutput | null>(null);
  const [creditScoreData, setCreditScoreData] = useState<AgriCreditScoreOutput | null>(null);
  const [recentDiagnoses, setRecentDiagnoses] = useState<Diagnosis[]>([]);
  const [diagnosesCount, setDiagnosesCount] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isCreditScoreLoading, setIsCreditScoreLoading] = useState(true);
  const [locationStatus, setLocationStatus] = useState("Loading...");
  const { t, language } = useTranslation();
  const { toast } = useToast();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
        router.push('/');
        return;
    }
    
    setIsLoading(true);

    const fetchAllData = async () => {
        
        getDoc(doc(db, "users", user.uid)).then(userDoc => {
            if (userDoc.exists()) {
                setUserData(userDoc.data() as UserData);
            }
        });
        
        getDashboardAnalytics({ userId: user.uid, email: user.email || undefined, language }).then(setAnalyticsData).catch(err => {
            console.error("Error fetching analytics data:", err);
            toast({ variant: "destructive", title: "Error", description: "Could not load dashboard analytics." });
        });

        getAgriCreditScore({ userId: user.uid, email: user.email || undefined, language }).then(setCreditScoreData).finally(() => setIsCreditScoreLoading(false));

        // Fetch recent diagnoses
        try {
            const q = query(
                collection(db, "diagnoses"), 
                where("userId", "==", user.uid), 
                orderBy("createdAt", "desc"),
                limit(3)
            );
            const querySnapshot = await getDocs(q);
            const diagnoses = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Diagnosis[];
            setRecentDiagnoses(diagnoses);
            setDiagnosesCount(querySnapshot.size); // Or a separate count query for performance
        } catch(err) {
            console.error("Error fetching diagnoses:", err);
            // Don't show a toast for this, as it might be an index issue.
            // The UI will show an empty state.
        }


        setLocationStatus("Fetching location...");
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                setLocationStatus("Fetching weather...");
                const weather = await getWeather({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
                setWeatherData(weather);
                setLocationStatus(weather ? `Weather for your location` : "Could not fetch weather.");
            },
            async (error) => {
                console.warn(`Geolocation error: ${error.message}. Falling back to default.`);
                setLocationStatus("Using default location...");
                const weather = await getWeather({ location: "Delhi" });
                setWeatherData(weather);
                setLocationStatus(weather ? "Weather for Delhi" : "Could not fetch weather for Delhi.");
            },
            { timeout: 10000 }
        );
    };

    fetchAllData().finally(() => setIsLoading(false));
  }, [user, authLoading, router, language, toast]);
  

  const getGreeting = () => {
    if (authLoading || !userData) {
      return t('profile.loadingTitle');
    }
    const name = userData?.name || t('userNav.user');
    return `${t('profile.hello')}, ${name}!`;
  };

  const pageDescription = isLoading ? t('profile.loadingDesc') : t('profile.pageDescription');

  const handleShareScore = () => {
    toast({
        title: t('creditScore.shareTitle'),
        description: t('creditScore.shareDesc'),
    });
  };
  
  const handleApplyLoan = () => {
      toast({
          title: t('creditScore.loanTitle'),
          description: t('creditScore.loanDesc'),
      });
  };

  return (
    <>
      <PageHeader
        title={getGreeting()}
        description={pageDescription}
      />
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('profile.totalRevenue')}</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{analyticsData?.totalRevenue.toLocaleString('en-IN') || '0'}</div>
                <p className="text-xs text-muted-foreground">
                  +{analyticsData?.revenueChange || '0'}% {t('profile.fromLastMonth')}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('profile.cropsPlanted')}</CardTitle>
                <Wheat className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData?.cropVarieties || '0'} {t('profile.varieties')}</div>
                <p className="text-xs text-muted-foreground">
                  +{analyticsData?.cropChange || '0'} {t('profile.sinceLastSeason')}
                </p>
              </CardContent>
            </Card>
             <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('profile.activeDiagnoses')}</CardTitle>
                <Leaf className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{diagnosesCount} {t('profile.active')}</div>
                 <p className="text-xs text-muted-foreground">
                    {t('profile.diagnosesThisMonth', {count: diagnosesCount})}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('creditScore.title')}</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{creditScoreData?.score || '...'}</div>
                 <p className="text-xs text-muted-foreground">
                  {creditScoreData?.trendPoints || 0} {t('creditScore.pointsThisMonth')}
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
      <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-3 xl:gap-8">
        {/* Left column */}
        <div className="grid auto-rows-max items-start gap-8 xl:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>{t('profile.monthlyEarnings')}</CardTitle>
                    <CardDescription>{t('profile.earningsDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-[200px] w-full" /> : <EarningsChart data={analyticsData?.monthlyEarnings ?? []} />}
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center">
                  <div className="grid gap-2">
                    <CardTitle>{t('profile.recentDiagnoses')}</CardTitle>
                    <CardDescription>
                      {t('profile.recentDiagnosesDesc')}
                    </CardDescription>
                  </div>
                  <Button asChild size="sm" className="ml-auto gap-1">
                    <Link href="/dashboard/crop-analysis">
                      {t('profile.viewAll')}
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('profile.plant')}</TableHead>
                        <TableHead>{t('profile.status')}</TableHead>
                        <TableHead className="text-right">{t('profile.date')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={3} className="text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                        ) : recentDiagnoses.length > 0 ? (
                            recentDiagnoses.map(d => (
                                <TableRow key={d.id}>
                                    <TableCell>{d.result.plantName}</TableCell>
                                    <TableCell>
                                        <Badge variant={d.result.isHealthy ? 'default' : 'destructive'} className={d.result.isHealthy ? 'bg-green-500/80' : ''}>
                                            {d.result.isHealthy ? 'Healthy' : d.result.diseaseName}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">{format(new Date(d.createdAt.seconds * 1000), 'dd MMM, yyyy')}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={3} className="text-center h-24">{t('profile.noDiagnoses')}</TableCell></TableRow>
                        )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
        </div>
        
        {/* Right Column */}
        <div className="grid auto-rows-max items-start gap-8">
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                  <CardTitle>{t('creditScore.title')}</CardTitle>
                  <CardDescription>{t('creditScore.description')}</CardDescription>
              </CardHeader>
              <CardContent>
                  {isCreditScoreLoading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-16 w-1/2 mx-auto" />
                        <Skeleton className="h-4 w-1/3 mx-auto" />
                        <div className="pt-4 space-y-2">
                            <Skeleton className="h-5 w-1/4" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                        </div>
                         <div className="pt-4 space-y-2">
                            <Skeleton className="h-5 w-1/3" />
                            <div className="flex gap-2">
                                <Skeleton className="h-6 w-24" />
                                <Skeleton className="h-6 w-24" />
                            </div>
                        </div>
                    </div>
                  ) : creditScoreData && (
                      <div className="space-y-4">
                           <div className="flex items-center justify-center text-center">
                                <div>
                                    <p className="text-6xl font-bold text-primary">{creditScoreData.score}</p>
                                    <div className={cn("flex items-center justify-center font-semibold", creditScoreData.trend === 'up' ? "text-green-600" : "text-red-500", creditScoreData.trend === 'stable' && "text-muted-foreground")}>
                                        {creditScoreData.trend !== 'stable' && <ArrowUp className={cn("h-4 w-4 mr-1", creditScoreData.trend === 'down' && "transform rotate-180")} />}
                                        {creditScoreData.trendPoints} {t('creditScore.pointsThisMonth')}
                                    </div>
                                </div>
                           </div>

                            <div>
                                <h4 className="font-semibold mb-2 flex items-center gap-2"><Lightbulb className="h-5 w-5 text-primary"/> {t('creditScore.tipsTitle')}</h4>
                                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                                    {creditScoreData.improvementTips.map((tip, i) => <li key={i}>{tip}</li>)}
                                </ul>
                                {creditScoreData.loanEligibility.isEligible && (
                                     <div className="mt-3 p-3 rounded-md bg-secondary border border-primary/20">
                                        <p className="text-sm font-semibold">{t('creditScore.loanEligibleText', { amount: creditScoreData.loanEligibility.amount.toLocaleString('en-IN') })}</p>
                                        <Button size="sm" className="w-full mt-2" onClick={handleApplyLoan}>
                                            <Banknote className="mr-2 h-4 w-4" /> {t('creditScore.applyLoan')}
                                        </Button>
                                     </div>
                                )}
                            </div>
                            
                            {creditScoreData.badges.length > 0 && (
                             <div>
                                <h4 className="font-semibold mb-2">{t('creditScore.badgesTitle')}</h4>
                                <div className="flex flex-wrap gap-2">
                                    {creditScoreData.badges.map(badge => (
                                        <Badge key={badge.name} variant="secondary" className="pl-2">
                                            <BadgeIcon iconName={badge.icon} className="h-4 w-4 mr-1 text-primary"/>
                                            {t(`creditScore.badges.${badge.name.replace(/ /g, '')}` as any, { defaultValue: badge.name })}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                            )}
                             <Button className="w-full mt-2" onClick={handleShareScore}>
                                <Share2 className="mr-2 h-4 w-4" />
                                {t('creditScore.share')}
                            </Button>
                      </div>
                  )}
              </CardContent>
            </Card>
        </div>
      </div>
    </>
  );
}
