"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { formatPrice } from "@/lib/utils";

export type SalesChartPoint = {
  date: string;
  revenue: number;
};

type SalesChartProps = {
  data: SalesChartPoint[];
};

export function SalesChart({ data }: SalesChartProps) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#D4A843" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#D4A843" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8E0D0" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#6B7280", fontSize: 12 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={40}
            tick={{ fill: "#6B7280", fontSize: 12 }}
            tickFormatter={(value: number) => `${Math.round(value / 1000)}k`}
          />
          <Tooltip
            formatter={(value: number) => formatPrice(value)}
            contentStyle={{ borderRadius: 12, borderColor: "#E8E0D0" }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#1B2A4A"
            strokeWidth={2}
            fill="url(#salesGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
