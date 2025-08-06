
"use client";

import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { doc, getDoc, collection, query, where, orderBy, limit, Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import AppLayout from "@/components/app-layout";
import PageHeader from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DollarSign, Leaf, Tractor, Wheat, Sun, Cloud, Thermometer, Loader2, CloudSun, CloudRain, CloudFog, CloudSnow, CloudLightning, Droplets, Wind } from "lucide-react";
import EarningsChart from "./earnings-chart";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/context/translation-context";
import { getWeather, type GetWeatherOutput } from "@/ai/flows/get-weather";


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


export default function DashboardPage() {
  const [user, authLoading] = useAuthState(auth);
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [weatherData, setWeatherData] = useState<GetWeatherOutput | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const { t } = useTranslation();

  const diagnosesQuery = user ? query(collection(db, "diagnoses"), where("userId", "==", user.uid), orderBy("createdAt", "desc"), limit(5)) : null;
  const [recentDiagnoses, diagnosesLoading] = useCollectionData(diagnosesQuery, { idField: 'id' });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
        router.push('/');
        return;
    }

    const fetchDashboardData = async () => {
      setIsDataLoading(true);
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        let fetchedUserData: UserData | null = null;
        if (userDoc.exists()) {
          fetchedUserData = userDoc.data() as UserData;
          setUserData(fetchedUserData);
        }

        // Fetch weather data if location is available
        if (fetchedUserData?.location) {
            const weather = await getWeather({ location: fetchedUserData.location });
            setWeatherData(weather);
        }

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
      } catch (error) {
        console.error("Error fetching dashboard data: ", error);
      } finally {
        setIsDataLoading(false);
      }
    };

    if(!diagnosesLoading) {
      fetchDashboardData();
    }
  }, [user, authLoading, router, recentDiagnoses, diagnosesLoading]);
  
  const isLoading = authLoading || isDataLoading;

  const getGreeting = () => {
    if (authLoading || !userData) {
      return t('profile.loadingTitle');
    }
    const name = userData?.name || t('userNav.user');
    return `${t('profile.hello')}, ${name}!`;
  };

  const pageDescription = isLoading ? t('profile.loadingDesc') : t('profile.pageDescription');

  return (
    <AppLayout>
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
                <div className="text-2xl font-bold">+{dashboardData?.activeDiagnosesCount || '0'}</div>
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
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3 mt-8">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>{t('profile.monthlyEarnings')}</CardTitle>
            <CardDescription>{t('profile.earningsDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <EarningsChart />
          </CardContent>
        </Card>
        <div className="space-y-4">
        <Card>
            <CardHeader>
                <CardTitle>{t('profile.weatherTitle')}</CardTitle>
                <CardDescription>{userData?.location ? t('profile.weatherDescription', {location: userData.location}) : t('profile.weatherDescriptionNoLocation')}</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex items-center justify-center h-24">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : weatherData ? (
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
                ) : (
                    <div className="text-center text-muted-foreground py-4">
                        {t('profile.weatherError')}
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
       <div className="grid gap-4 md:gap-8 mt-8">
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
    </AppLayout>
  );
}
