"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { cn, formatPrice } from "@/lib/utils";

export type SalesChartPoint = {
  date: string;
  fullDate: string;
  revenue: number;
};

type SalesChartProps = {
  data: SalesChartPoint[];
};

const RANGES = [
  { label: "7 días", days: 7 },
  { label: "30 días", days: 30 },
  { label: "90 días", days: 90 },
] as const;

export function SalesChart({ data }: SalesChartProps) {
  const [rangeDays, setRangeDays] = useState<number>(30);

  const visibleData = useMemo(() => data.slice(-rangeDays), [data, rangeDays]);

  return (
    <div className="space-y-3">
      <div className="flex justify-end gap-1">
        {RANGES.map((range) => (
          <button
            key={range.days}
            type="button"
            onClick={() => setRangeDays(range.days)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              rangeDays === range.days
                ? "bg-navy text-white"
                : "bg-cream text-navy hover:bg-cream-dark",
            )}
          >
            {range.label}
          </button>
        ))}
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={visibleData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
              minTickGap={24}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={40}
              tick={{ fill: "#6B7280", fontSize: 12 }}
              tickFormatter={(value: number) => `${Math.round(value / 1000)}k`}
            />
            <Tooltip
              formatter={(value: number) => [formatPrice(value), "Ventas"]}
              labelFormatter={(_, payload) => payload?.[0]?.payload?.fullDate ?? ""}
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
    </div>
  );
}
