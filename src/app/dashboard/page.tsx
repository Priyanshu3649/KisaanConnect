
"use client";

import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { doc, getDoc, collection, query, where, orderBy, limit, Timestamp, writeBatch, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import PageHeader from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DollarSign, Leaf, Tractor, Wheat, Sun, Cloud, Thermometer, Loader2, CloudSun, CloudRain, CloudFog, CloudSnow, CloudLightning, ArrowUp, Share2, ShieldCheck, Star, BadgeCheck, Lightbulb, Banknote, Database } from "lucide-react";
import EarningsChart from "./earnings-chart";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/context/translation-context";
import { getWeather, type GetWeatherOutput } from "@/ai/flows/get-weather";
import { getAgriCreditScore, type AgriCreditScoreOutput } from "@/ai/flows/agri-credit-score";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";


interface UserData {
  name?: string;
  location?: string;
}
interface Diagnosis {
    id: string;
    crop: string;
    disease: string;
    status: 'Active' | 'Resolved';
    progress: number;
    createdAt: Timestamp;
    userId: string;
}
interface Rental {
    equipment: string;
    type: 'Lending' | 'Borrowing';
    due: string;
}
interface DashboardData {
    totalRevenue: number;
    revenueChange: number;
    activeDiagnosesCount: number;
    resolvedThisWeek: number;
    cropVarieties: number;
    cropChange: number;
    activeRentalsCount: number;
    lendingCount: number;
    borrowingCount: 1,
    activeRentals: Rental[];
}

const demoDiagnosesData: Omit<Diagnosis, 'id' | 'createdAt' | 'userId'>[] = [
    { crop: "Tomato", disease: "Late Blight", status: "Active", progress: 25 },
    { crop: "Wheat", disease: "Rust", status: "Active", progress: 50 },
    { crop: "Potato", disease: "Healthy", status: "Resolved", progress: 100 },
];

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
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [weatherData, setWeatherData] = useState<GetWeatherOutput | null>(null);
  const [creditScoreData, setCreditScoreData] = useState<AgriCreditScoreOutput | null>(null);
  const [isCreditScoreLoading, setIsCreditScoreLoading] = useState(true);
  const [locationStatus, setLocationStatus] = useState("Loading...");
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const { t, language } = useTranslation();
  const { toast } = useToast();

  const diagnosesQuery = user ? query(collection(db, "diagnoses"), where("userId", "==", user.uid), orderBy("createdAt", "desc"), limit(5)) : null;
  const [recentDiagnoses, diagnosesLoading] = useCollectionData(diagnosesQuery, { idField: 'id' });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
        router.push('/');
        return;
    }

    const fetchAllData = async () => {
        setIsDataLoading(true);

        try {
            // Fetch user doc and static data in parallel
            const userDoc = await getDoc(doc(db, "users", user.uid));

            if (userDoc.exists()) {
                setUserData(userDoc.data() as UserData);
            }

            // Fetch static dashboard data
            const activeDiagnosesCount = recentDiagnoses?.filter(d => (d as Diagnosis).status === 'Active').length || 0;
            const data: DashboardData = {
                totalRevenue: 45231.89,
                revenueChange: 20.1,
                activeDiagnosesCount: activeDiagnosesCount,
                resolvedThisWeek: 1, 
                cropVarieties: 12,
                cropChange: 2,
                activeRentalsCount: 2,
                lendingCount: 1,
                borrowingCount: 1,
                activeRentals: [
                    { equipment: "John Deere Tractor", type: "Lending", due: "3 days" },
                    { equipment: "Power Tiller", type: "Borrowing", due: "5 days" },
                ]
            };
            setDashboardData(data);
            setIsDataLoading(false);

            // Fetch weather data
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

        } catch (error) {
            console.error("Error fetching dashboard data: ", error);
            setIsDataLoading(false);
        }
    };

    const fetchCreditScore = async () => {
        if (!user) return;
        setIsCreditScoreLoading(true);
        try {
            const creditScore = await getAgriCreditScore({ userId: user.uid, language: language });
            setCreditScoreData(creditScore);
        } catch (error) {
            console.error("Error fetching credit score:", error);
            toast({ variant: 'destructive', title: "Error", description: "Could not load Agri-Credit Score."});
        } finally {
            setIsCreditScoreLoading(false);
        }
    };

    if (!diagnosesLoading && user) {
      fetchAllData();
      fetchCreditScore();
    }
  }, [user, authLoading, router, diagnosesLoading, language, toast]);
  
  const isLoading = authLoading || isDataLoading;

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
  }
  
  const handleApplyLoan = () => {
      toast({
          title: t('creditScore.loanTitle'),
          description: t('creditScore.loanDesc'),
      });
  }

  const getLoanTip = () => {
      if (!creditScoreData?.loanEligibility.isEligible) return null;
      const loanTip = creditScoreData.improvementTips.find(tip => tip.includes(creditScoreData.loanEligibility.amount.toString()));
      return loanTip;
  }
  
  const handleSeedData = async () => {
      if (!user) {
          toast({ variant: "destructive", title: "You must be logged in." });
          return;
      }
      setIsSeeding(true);
      try {
          const batch = writeBatch(db);
          demoDiagnosesData.forEach(item => {
              const docRef = doc(collection(db, "diagnoses"));
              batch.set(docRef, { 
                  ...item, 
                  userId: user.uid, 
                  createdAt: serverTimestamp() 
              });
          });
          await batch.commit();
          toast({
              title: "Demo Data Added",
              description: `${demoDiagnosesData.length} sample diagnoses have been added to your database.`,
          });
      } catch (e) {
          console.error("Error seeding diagnoses data:", e);
          toast({ variant: 'destructive', title: "Error", description: "Could not add demo diagnoses data." });
      } finally {
          setIsSeeding(false);
      }
  };


  return (
    <>
      <PageHeader
        title={getGreeting()}
        description={pageDescription}
      >
        <Button onClick={handleSeedData} disabled={isSeeding || (recentDiagnoses && recentDiagnoses.length > 0)}>
            <Database className="mr-2 h-4 w-4" />
            {isSeeding ? "Seeding..." : "Seed Demo Data"}
        </Button>
      </PageHeader>
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
                <div className="text-2xl font-bold">₹{dashboardData?.totalRevenue.toLocaleString('en-IN') || '0'}</div>
                <p className="text-xs text-muted-foreground">
                  +{dashboardData?.revenueChange || '0'}% {t('profile.fromLastMonth')}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('profile.activeDiagnoses')}</CardTitle>
                <Leaf className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+{recentDiagnoses?.filter(d => (d as Diagnosis).status === 'Active').length || '0'}</div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData?.resolvedThisWeek || '0'} {t('profile.resolvedThisWeek')}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('profile.cropsPlanted')}</CardTitle>
                <Wheat className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData?.cropVarieties || '0'} {t('profile.varieties')}</div>
                <p className="text-xs text-muted-foreground">
                  +{dashboardData?.cropChange || '0'} {t('profile.sinceLastSeason')}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('profile.equipmentRentals')}</CardTitle>
                <Tractor className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+{dashboardData?.activeRentalsCount || '0'} {t('profile.active')}</div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData?.lendingCount || '0'} {t('profile.lending')}, {dashboardData?.borrowingCount || '0'} {t('profile.borrowing')}
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
      <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-3 xl:gap-8">
        {/* Left column */}
        <div className="grid auto-rows-max items-start gap-8 xl:col-span-2">
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle>{t('profile.monthlyEarnings')}</CardTitle>
                <CardDescription>{t('profile.earningsDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <EarningsChart />
              </CardContent>
            </Card>
             <Card>
              <CardHeader>
                <CardTitle>{t('profile.activeRentals')}</CardTitle>
                <CardDescription>
                  {t('profile.rentalsDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                 <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('profile.rentalsEquipment')}</TableHead>
                      <TableHead>{t('profile.rentalsType')}</TableHead>
                      <TableHead className="text-right">{t('profile.rentalsDue')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboardData?.activeRentals.map((rental, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="font-medium">{rental.equipment}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={rental.type === 'Lending' ? 'border-green-500 text-green-500' : 'border-blue-500 text-blue-500'}>
                            {t(`profile.rentalType${rental.type}` as any)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{rental.due}</TableCell>
                      </TableRow>
                    ))}
                    {(!dashboardData || dashboardData.activeRentals.length === 0) && (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center h-24">
                                {t('profile.noActiveRentals')}
                            </TableCell>
                        </TableRow>
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
                                    <div className={cn("flex items-center justify-center font-semibold", creditScoreData.trend === 'up' ? "text-green-600" : "text-red-500")}>
                                        <ArrowUp className="h-4 w-4 mr-1" />
                                        {creditScoreData.trendPoints} {t('creditScore.pointsThisMonth')}
                                    </div>
                                </div>
                           </div>

                            <div>
                                <h4 className="font-semibold mb-2 flex items-center gap-2"><Lightbulb className="h-5 w-5 text-primary"/> {t('creditScore.tipsTitle')}</h4>
                                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                                    {creditScoreData.improvementTips.filter(tip => !tip.includes(creditScoreData.loanEligibility.amount.toString())).map((tip, i) => <li key={i}>{tip}</li>)}
                                </ul>
                                {getLoanTip() && (
                                     <div className="mt-3 p-3 rounded-md bg-secondary border border-primary/20">
                                        <p className="text-sm font-semibold">{getLoanTip()}</p>
                                        <Button size="sm" className="w-full mt-2" onClick={handleApplyLoan}>
                                            <Banknote className="mr-2 h-4 w-4" /> {t('creditScore.applyLoan')}
                                        </Button>
                                     </div>
                                )}
                            </div>
                            
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
                             <Button className="w-full mt-2" onClick={handleShareScore}>
                                <Share2 className="mr-2 h-4 w-4" />
                                {t('creditScore.share')}
                            </Button>
                      </div>
                  )}
              </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>{t('profile.weatherTitle')}</CardTitle>
                    <CardDescription>{locationStatus}</CardDescription>
                </CardHeader>
                <CardContent>
                    {!weatherData ? (
                        <div className="flex items-center justify-center h-24">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <WeatherIcon iconName={weatherData.current.icon} className="h-12 w-12 text-yellow-500" />
                                <div>
                                    <div className="text-3xl font-bold">{weatherData.current.temperature}°C</div>
                                    <div className="text-muted-foreground">{weatherData.current.condition}</div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end text-sm">
                                <div className="flex items-center gap-1"><Thermometer className="h-4 w-4 text-muted-foreground"/> H: {weatherData.current.high}° / L: {weatherData.current.low}°</div>
                                <div className="flex items-center gap-1"><Cloud className="h-4 w-4 text-muted-foreground"/> {t('profile.weatherClouds')}: {weatherData.current.cloudCover}%</div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{t('profile.recentDiagnoses')}</CardTitle>
                <CardDescription>
                  {t('profile.diagnosesDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                 <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('profile.diagnosesCrop')}</TableHead>
                      <TableHead>{t('profile.diagnosesStatus')}</TableHead>
                      <TableHead className="text-right">{t('profile.diagnosesTreatment')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {diagnosesLoading && (
                        <TableRow>
                            <TableCell colSpan={3} className="h-24 text-center">
                                <div className="flex justify-center items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                    <span>{t('profile.loadingDiagnoses')}</span>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                    {recentDiagnoses && recentDiagnoses.map((diag) => (
                      <TableRow key={diag.id}>
                        <TableCell className="font-medium">{(diag as Diagnosis).crop}</TableCell>
                        <TableCell>
                          <Badge variant={(diag as Diagnosis).status === 'Active' ? 'destructive' : 'default'}>{t(`profile.status${(diag as Diagnosis).status}` as any)}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                                <span>{(diag as Diagnosis).progress}%</span>
                                <Progress value={(diag as Diagnosis).progress} className="w-20 h-2" />
                            </div>
                        </TableCell>
                      </TableRow>
                    ))}
                     {!diagnosesLoading && (!recentDiagnoses || recentDiagnoses.length === 0) && (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center h-24">
                               {t('profile.noDiagnoses')}
                            </TableCell>
                        </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
        </div>
      </div>
    </>
  );
}
