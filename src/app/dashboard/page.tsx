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
import { DollarSign, Leaf, Tractor, Wheat } from "lucide-react";
import EarningsChart from "./earnings-chart";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";

interface UserData {
  name?: string;
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
    borrowingCount: number;
    activeRentals: Rental[];
}

const StatCardSkeleton = () => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-5 w-2/4" />
            <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-2/4" />
        </CardContent>
    </Card>
);

export default function DashboardPage() {
  const [user, authLoading] = useAuthState(auth);
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Real-time listener for recent diagnoses
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
        // Fetch user's name
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUserData(userDoc.data() as UserData);
        }

        // In a real app, you would fetch this data from Firestore.
        // For this prototype, we'll use placeholder data that simulates a real fetch.
        const data: DashboardData = {
            totalRevenue: 45231.89,
            revenueChange: 20.1,
            activeDiagnosesCount: recentDiagnoses?.filter(d => d.status === 'Active').length || 0,
            resolvedThisWeek: 1, // This would require more complex querying
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

    fetchDashboardData();
  }, [user, authLoading, router, recentDiagnoses]);
  
  const isLoading = authLoading || isDataLoading;

  if (isLoading) {
      return (
          <AppLayout>
              <PageHeader
                  title="Welcome Back!"
                  description="Loading your farm's summary..."
              />
               <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                  <StatCardSkeleton />
               </div>
          </AppLayout>
      )
  }

  return (
    <AppLayout>
      <PageHeader
        title={`Hello, ${userData?.name || 'Farmer'}!`}
        description="Here's a summary of your farm's activity."
      />
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{dashboardData?.totalRevenue.toLocaleString('en-IN') || '0'}</div>
            <p className="text-xs text-muted-foreground">
              +{dashboardData?.revenueChange || '0'}% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Diagnoses</CardTitle>
            <Leaf className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{dashboardData?.activeDiagnosesCount || '0'}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardData?.resolvedThisWeek || '0'} resolved this week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crops Planted</CardTitle>
            <Wheat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.cropVarieties || '0'} Varieties</div>
            <p className="text-xs text-muted-foreground">
              +{dashboardData?.cropChange || '0'} since last season
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Equipment Rentals</CardTitle>
            <Tractor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{dashboardData?.activeRentalsCount || '0'} Active</div>
            <p className="text-xs text-muted-foreground">
              {dashboardData?.lendingCount || '0'} lending, {dashboardData?.borrowingCount || '0'} borrowing
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Earnings</CardTitle>
            <CardDescription>A summary of your earnings over the last 6 months.</CardDescription>
          </CardHeader>
          <CardContent>
            <EarningsChart />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Crop Diagnoses</CardTitle>
            <CardDescription>
              Monitor the health of your crops.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
             <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Crop</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Treatment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {diagnosesLoading && (
                    <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center">
                            Loading diagnoses...
                        </TableCell>
                    </TableRow>
                )}
                {!diagnosesLoading && recentDiagnoses && recentDiagnoses.map((diag) => (
                  <TableRow key={diag.id}>
                    <TableCell className="font-medium">{diag.crop}</TableCell>
                    <TableCell>
                      <Badge variant={diag.status === 'Active' ? 'destructive' : 'default'}>{diag.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                            <span>{diag.progress}%</span>
                            <Progress value={diag.progress} className="w-20 h-2" />
                        </div>
                    </TableCell>
                  </TableRow>
                ))}
                 {!diagnosesLoading && (!recentDiagnoses || recentDiagnoses.length === 0) && (
                    <TableRow>
                        <TableCell colSpan={3} className="text-center h-24">
                            No recent diagnoses found.
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
       <div className="grid gap-4 md:gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Active Equipment Rentals</CardTitle>
            <CardDescription>
              Keep track of equipment you're borrowing and lending.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipment</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Due In</TableHead>
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
                        {rental.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{rental.due}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}