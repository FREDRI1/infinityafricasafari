"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type SafariClickDatum = {
  name: string;
  clicks: number;
};

export function AdminSafariClickChart({ data }: { data: SafariClickDatum[] }) {
  if (!data.length) {
    return (
      <div className="analytics-chart-empty">
        <p>Safari package clicks will appear here as visitors explore journeys.</p>
      </div>
    );
  }

  return (
    <div className="analytics-chart" role="img" aria-label="Most clicked safari packages">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          accessibilityLayer
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 24, bottom: 8, left: 8 }}
        >
          <CartesianGrid horizontal={false} stroke="#ebe9e1" />
          <XAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#777b73", fontSize: 11 }}
            type="number"
          />
          <YAxis
            axisLine={false}
            dataKey="name"
            tickLine={false}
            tick={{ fill: "#34453b", fontSize: 11 }}
            type="category"
            width={145}
          />
          <Tooltip
            cursor={{ fill: "#f7f5ef" }}
            formatter={(value) => [`${Number(value).toLocaleString()} clicks`, "Clicks"]}
            contentStyle={{
              border: "1px solid #e8e4da",
              borderRadius: 10,
              fontSize: 12,
            }}
          />
          <Bar
            dataKey="clicks"
            fill="#0a2e20"
            maxBarSize={28}
            radius={[0, 5, 5, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
