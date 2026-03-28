// app/logs/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Filter, Download, ChevronDown } from "lucide-react";

interface Log {
  id: string;
  url: string;
  verdict: string;
  score: number;
  reasons: string;
  createdAt: string;
  clientIp: string;
  source: string;
}

export default function Logs() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/logs", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    }
  };

  const getVerdictStyle = (verdict: string) => {
    switch (verdict) {
      case "unsafe":
        return "bg-red-500/20 text-red-400";
      case "suspicious":
        return "bg-amber-500/20 text-amber-400";
      default:
        return "bg-emerald-500/20 text-emerald-400";
    }
  };

  return (
    <main className=" w-full p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Detection Logs</h1>
        <button className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-xs text-slate-400">
          <Download className="h-4 w-4" />
          Export
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-2">
        <button className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-xs text-slate-400">
          <Filter className="h-3 w-3" />
          Filter
          <ChevronDown className="h-3 w-3" />
        </button>
        <button
          onClick={() => setFilter("")}
          className={`rounded-lg px-4 py-2 text-xs ${!filter ? "bg-blue-500/20 text-blue-400" : "bg-slate-800/50 text-slate-400"}`}
        >
          All
        </button>
        <button
          onClick={() => setFilter("unsafe")}
          className={`rounded-lg px-4 py-2 text-xs ${filter === "unsafe" ? "bg-red-500/20 text-red-400" : "bg-slate-800/50 text-slate-400"}`}
        >
          Blocked
        </button>
      </div>

      {/* Logs List */}
      <div className="space-y-2">
        {logs
          .filter((l) => !filter || l.verdict === filter)
          .map((log, i) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              className="rounded-xl border border-slate-800 bg-slate-900/30 p-4"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-white">
                    {new URL(log.url).hostname}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {log.url.substring(0, 60)}...
                  </p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                    <span>{new Date(log.createdAt).toLocaleString()}</span>
                    <span>•</span>
                    <span>IP: {log.clientIp}</span>
                    <span>•</span>
                    <span className="capitalize">{log.source}</span>
                  </div>
                </div>
                <span
                  className={`rounded-lg px-2 py-1 text-[10px] font-bold uppercase ${getVerdictStyle(log.verdict)}`}
                >
                  {log.verdict}
                </span>
              </div>
              {log.score > 0 && (
                <div className="mt-3">
                  <div className="h-1 w-full rounded-full bg-slate-800">
                    <div
                      className={`h-full rounded-full ${
                        log.verdict === "unsafe"
                          ? "bg-red-500"
                          : log.verdict === "suspicious"
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                      }`}
                      style={{ width: `${log.score}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Risk Score: {log.score}/100
                  </p>
                </div>
              )}
            </motion.div>
          ))}
      </div>
    </main>
  );
}
