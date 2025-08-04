"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const data = [
  { month: "Jan", earnings: 1860 },
  { month: "Feb", earnings: 3050 },
  { month: "Mar", earnings: 2370 },
  { month: "Apr", earnings: 730 },
  { month: "May", earnings: 2090 },
  { month: "Jun", earnings: 2140 },
]

const chartConfig = {
  earnings: {
    label: "Earnings",
    color: "hsl(var(--primary))",
  },
}

export default function EarningsChart() {
  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
        <BarChart accessibilityLayer data={data}>
        <XAxis
          dataKey="month"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `₹${value / 1000}k`}
        />
        <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent indicator="dot" />}
          />
        <Bar 
            dataKey="earnings" 
            fill="hsl(var(--primary))" 
            radius={[4, 4, 0, 0]}
        />
        </BarChart>
    </ChartContainer>
  )
}
