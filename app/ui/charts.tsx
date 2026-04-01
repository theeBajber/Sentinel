"use client";

import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
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

// threshold for "many"
const THRESHOLD = 7;

export default function ThreatsBarChart() {
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const { apiFetch } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiFetch("/api/threat-trend");
        const json = await res.json();
        setData(Array.isArray(json) ? json : []);
      } catch (e) {
        console.error("Chart error:", e);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="w-full h-full bg-bg-card rounded-xl p-4">
      {loading ? (
        <div className="w-full h-full flex items-center justify-center text-text-muted animate-pulse">
          Loading...
        </div>
      ) : data.length === 0 ? (
        <div className="w-full h-full flex items-center justify-center text-text-muted">
          No threat data
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
          >
            {/* EXACT SAME STYLING */}
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(198,198,205,0.1)"
              vertical={false}
            />

            <XAxis
              dataKey="day"
              axisLine={true}
              tickLine={false}
              tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
            />

            <YAxis
              axisLine={true}
              tickLine={true}
              tick={true}
              domain={[0, "dataMax + 2"]}
            />

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
      )}
    </div>
  );
}
