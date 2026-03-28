// app/threats/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Trash2, Clock } from "lucide-react";

interface Threat {
  id: string;
  pattern: string;
  severity: "low" | "medium" | "high" | "critical";
  source: string;
  createdAt: string;
  isRegex: boolean;
}

export default function Threats() {
  const [threats, setThreats] = useState<Threat[]>([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchThreats();
  }, []);

  const fetchThreats = async () => {
    try {
      const res = await fetch("/api/threats", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.ok) {
        const data = await res.json();
        setThreats(data);
      }
    } catch (error) {
      console.error("Failed to fetch threats:", error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "high":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "medium":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      default:
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    }
  };

  const filteredThreats = threats.filter((t) => {
    if (filter !== "all" && t.severity !== filter) return false;
    if (search && !t.pattern.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  return (
    <main className="p-6">
      <h1 className="mb-2 text-3xl font-bold text-white">Active Threats</h1>
      <p className="mb-6 text-sm text-slate-400">Surveillance Module</p>

      <div className="relative mb-4">
        <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by URL, File or Hash..."
          className="w-full rounded-xl border border-slate-700 bg-slate-800/50 py-3 pl-12 pr-4 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {["all", "high", "medium", "low"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-2 text-xs font-medium uppercase tracking-wider whitespace-nowrap ${
              filter === f
                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                : "bg-slate-800/50 text-slate-400 border border-slate-700"
            }`}
          >
            {f === "all" ? "All Logs" : `${f} Severity`}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filteredThreats.map((threat, i) => (
          <motion.div
            key={threat.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="truncate font-medium text-white">
                  {threat.pattern}
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  {new Date(threat.createdAt).toLocaleDateString()} • Type:{" "}
                  {threat.isRegex ? "Regex" : "String"}
                </p>
              </div>
              <span
                className={`rounded-lg px-2 py-1 text-[10px] font-bold uppercase ${getSeverityColor(threat.severity)}`}
              >
                ! {threat.severity}
              </span>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <div className="h-1 flex-1 rounded-full bg-slate-800">
                <div
                  className={`h-full rounded-full ${
                    threat.severity === "critical"
                      ? "bg-red-500 w-[95%]"
                      : threat.severity === "high"
                        ? "bg-orange-500 w-[75%]"
                        : threat.severity === "medium"
                          ? "bg-amber-500 w-[50%]"
                          : "bg-blue-500 w-[25%]"
                  }`}
                />
              </div>
              <span className="text-xs text-slate-500">
                {threat.severity === "critical"
                  ? "98/100"
                  : threat.severity === "high"
                    ? "75/100"
                    : threat.severity === "medium"
                      ? "50/100"
                      : "25/100"}
              </span>
            </div>

            <div className="mt-4 flex gap-2">
              <button className="flex-1 rounded-lg border border-slate-700 bg-slate-800/50 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800">
                Ignore
              </button>
              <button className="flex-1 rounded-lg bg-linear-to-r from-blue-600 to-blue-700 py-2 text-xs font-medium text-white">
                Purge Threat
              </button>
              <button className="rounded-lg border border-slate-700 bg-slate-800/50 p-2 text-slate-400 hover:text-red-400">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/50 py-3 text-sm text-slate-400 hover:text-white">
        <Clock className="h-4 w-4" />
        LOAD MORE INCIDENT LOGS
      </button>
    </main>
  );
}
