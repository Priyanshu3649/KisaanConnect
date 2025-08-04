import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import AppLayout from "@/components/app-layout";
import PageHeader from "@/components/page-header";
import { DollarSign, Leaf, Tractor, Wheat } from "lucide-react";
import EarningsChart from "./earnings-chart";

const recentDiagnoses = [
  { crop: "Tomato", disease: "Late Blight", status: "Active", progress: 75 },
  { crop: "Potato", disease: "Early Blight", status: "Resolved", progress: 100 },
  { crop: "Wheat", disease: "Rust", status: "Active", progress: 40 },
];

const activeRentals = [
    { equipment: "John Deere Tractor", type: "Lending", due: "3 days" },
    { equipment: "Power Tiller", type: "Borrowing", due: "5 days" },
]

export default function DashboardPage() {
  return (
    <AppLayout>
      <PageHeader
        title="Welcome Back, Farmer!"
        description="Here's a summary of your farm's activity."
      />
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹45,231.89</div>
            <p className="text-xs text-muted-foreground">
              +20.1% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Diagnoses</CardTitle>
            <Leaf className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+2</div>
            <p className="text-xs text-muted-foreground">
              1 resolved this week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crops Planted</CardTitle>
            <Wheat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12 Varieties</div>
            <p className="text-xs text-muted-foreground">
              +2 since last season
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Equipment Rentals</CardTitle>
            <Tractor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+2 Active</div>
            <p className="text-xs text-muted-foreground">
              1 lending, 1 borrowing
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
          <CardContent>
             <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Crop</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Treatment Progress</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentDiagnoses.map((diag, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="font-medium">{diag.crop}</div>
                      <div className="text-sm text-muted-foreground">{diag.disease}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={diag.status === 'Active' ? 'destructive' : 'default'} className="bg-accent text-accent-foreground">{diag.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                            <span>{diag.progress}%</span>
                            <Progress value={diag.progress} className="w-20" />
                        </div>
                    </TableCell>
                  </TableRow>
                ))}
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
                {activeRentals.map((rental, index) => (
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
