// components/ThreatsBarChart.tsx
"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
} from "recharts";

type DataPoint = {
  day: string;
  blocked: number;
};

const data: DataPoint[] = [
  { day: "Mon", blocked: 2 },
  { day: "Tue", blocked: 5 },
  { day: "Wed", blocked: 8 },
  { day: "Thu", blocked: 3 },
  { day: "Fri", blocked: 10 },
  { day: "Sat", blocked: 6 },
  { day: "Sun", blocked: 4 },
];

// threshold for "many"
const THRESHOLD = 7;

export default function ThreatsBarChart() {
  return (
    <div className="w-full h-full bg-bg-card rounded-xl p-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
        >
          {/* subtle horizontal grid lines */}
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(198,198,205,0.1)"
            vertical={false}
          />

          {/* X Axis (days only) */}
          <XAxis
            dataKey="day"
            axisLine={true}
            tickLine={false}
            tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
          />

          {/* Y Axis (no labels, only grid reference) */}
          <YAxis
            axisLine={true}
            tickLine={true}
            tick={true} // hides numbers
            domain={[0, "dataMax + 2"]}
          />

          {/* Bars */}
          <Bar dataKey="blocked" radius={[6, 6, 0, 0]} isAnimationActive>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  entry.blocked >= THRESHOLD
                    ? "var(--color-accent-rose)"
                    : "var(--color-accent-blue)"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
