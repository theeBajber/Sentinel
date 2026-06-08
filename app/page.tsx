// app/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Search,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Link2,
  RadarIcon,
  BanIcon,
  ClockFadingIcon,
  ShieldCheckIcon,
} from "lucide-react";
import Link from "next/link";
import ThreatsBarChart from "./ui/charts";
import { useAuth } from "@/lib/auth-context";

interface ScanResult {
  verdict: "safe" | "suspicious" | "unsafe";
  score: number;
  reasons: string[];
  confidence?: number;
  threatType?: string;
}

interface Log {
  id: string;
  url: string;
  verdict: string;
  score: number;
  reasons: string;
  createdAt: string;
}

export default function Dashboard() {
  const { apiFetch } = useAuth();
  const [url, setUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [stats, setStats] = useState({
    totalScans: 0,
    threatsBlocked: 0,
    systemHealth: 99.9,
  });
  const [recentLogs, setRecentLogs] = useState<Log[]>([]);

  useEffect(() => {
    fetchStats();
    fetchRecentLogs();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await apiFetch("/api/stats");
      if (res.ok) {
        const data = await res.json();
        setStats({
          totalScans: data.totalScans,
          threatsBlocked: data.threatsBlocked,
          systemHealth: data.systemHealth,
        });
        console.log("Stats data:", data);
      }
    } catch (e) {
      console.error("Failed to fetch stats:", e);
    }
  };

  const fetchRecentLogs = async () => {
    try {
      const res = await apiFetch("/api/logs?limit=4");
      if (res.ok) {
        const logs = await res.json();
        setRecentLogs(logs);
      }
    } catch (e) {
      console.error("Failed to fetch logs:", e);
    }
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || scanning) return;

    setScanning(true);
    setResult(null);

    try {
      const res = await apiFetch("/api/scan-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();
      setResult(data);
      fetchRecentLogs();
      fetchStats();
    } catch (error) {
      console.error("Scan failed:", error);
    } finally {
      setScanning(false);
    }
  };

  const getStatusColor = (verdict: string) => {
    switch (verdict) {
      case "safe":
        return "text-success bg-success/20 border-success/30";
      case "suspicious":
        return "text-warning bg-warning/20 border-warning/30";
      case "unsafe":
        return "text-danger bg-danger/20 border-danger/30";
      default:
        return "text-slate-400 bg-slate-500/20";
    }
  };

  const getStatusIcon = (verdict: string) => {
    switch (verdict) {
      case "safe":
        return <CheckCircle className="h-6 w-6" />;
      case "suspicious":
        return <AlertTriangle className="h-6 w-6" />;
      case "unsafe":
        return <XCircle className="h-6 w-6" />;
      default:
        return <Shield className="h-6 w-6" />;
    }
  };

  function getRelativeTime(dateString: string) {
    const now = new Date();
    const past = new Date(dateString);

    const diff = (past.getTime() - now.getTime()) / 1000; // seconds

    const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

    const intervals = [
      { label: "year", seconds: 31536000 },
      { label: "month", seconds: 2592000 },
      { label: "day", seconds: 86400 },
      { label: "hour", seconds: 3600 },
      { label: "minute", seconds: 60 },
      { label: "second", seconds: 1 },
    ];

    for (const { label, seconds } of intervals) {
      const value = diff / seconds;
      if (Math.abs(value) >= 1) {
        return rtf.format(
          Math.round(value),
          label as Intl.RelativeTimeFormatUnit,
        );
      }
    }

    return "just now";
  }
  const formatLog = (log: Log) => {
    const url = new URL(log.url);
    return {
      id: log.id,
      title: url.hostname,
      subtitle: log.url,
      type:
        log.verdict === "unsafe"
          ? "Phishing"
          : log.verdict === "suspicious"
            ? "Suspicious"
            : "URL",
      status: log.verdict,

      time: getRelativeTime(log.createdAt),
    };
  };

  return (
    <main className="flex flex-col gap-6 max-w-4xl lg:max-w-310 w-full items-center p-4 sm:p-6 mx-auto">
      {/* Hero Card with Scan Input */}
      <section className="flex flex-col lg:flex-row items-stretch gap-4 lg:gap-6 w-full min-h-[28rem] lg:min-h-[34rem]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative flex flex-col w-full lg:w-2/3 p-4 sm:p-6 rounded-xl bg-bg-card"
        >
          <div className="flex w-full flex-col">
            <div className="flex w-full items-center justify-between">
              <p className="text-xs text-text-primary uppercase tracking-widest">
                Current Protection Status
              </p>
              <div className="rounded-full bg-accent-blue size-3 animate-pulse" />
            </div>
            <h1 className="my-4 text-3xl sm:text-5xl lg:text-6xl font-bold text-text-primary">
              System Secure
            </h1>
            <p className="leading-relaxed text-base sm:text-lg text-text-muted">
              No active threats detected. All real-time interception layers are
              active and monitoring incoming protocols.
            </p>
          </div>
          <div className="w-full">
            {/* Scan Input */}
            <form onSubmit={handleScan} className="mt-6">
              <div className="flex px-4 h-16 gap-2 bg-bg-primary/50 rounded-xl w-full items-center">
                <Link2 className="h-5 w-5 text-accent-blue flex-shrink-0" />
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Enter URL to scan..."
                  className="w-full p-2 text-sm text-text-primary placeholder-accent-blue/70 outline-none"
                  required
                />
                <button
                  type="submit"
                  disabled={scanning || !url.trim()}
                  className="rounded-lg bg-accent-blue/90 text-sm font-semibold text-bg-primary transition-all hover:bg-accent-blue disabled:opacity-80 disabled:cursor-not-allowed flex items-center gap-2 h-[70%] px-2 w-auto justify-center"
                >
                  {scanning ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  {scanning ? "Scanning" : "SCAN"}
                </button>
              </div>
            </form>
            {/* Scan Result */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4"
                >
                  <div
                    className={`rounded-xl border p-4 ${getStatusColor(result.verdict)}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {getStatusIcon(result.verdict)}
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <h3 className="font-semibold capitalize">
                            {result.verdict}
                          </h3>
                          <span className="text-xs opacity-80">
                            {result.confidence}% confidence
                          </span>
                        </div>
                        <p className="mt-1 text-sm opacity-90">
                          Score: {result.score}/100
                        </p>
                        {result.reasons.length > 0 && (
                          <ul className="mt-2 space-y-1 text-xs opacity-80">
                            {result.reasons.slice(0, 3).map((reason, i) => (
                              <li key={i}>• {reason}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:gap-4 w-full lg:w-1/3 min-h-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex-1 bg-bg-card rounded-xl backdrop-blur-sm border-l-4 border-accent-blue flex flex-col gap-4 justify-center p-4 sm:p-6 min-h-0"
          >
            <div className="w-full flex items-center justify-between text-accent-blue">
              <RadarIcon className="size-5" />
              <span className="text-xs font-semibold p-1 px-1.5 bg-accent-blue/20">
                LAST 24H
              </span>
            </div>
            <p className="text-2xl sm:text-4xl my-2 font-bold text-text-primary">
              {stats.totalScans.toLocaleString()}
            </p>
            <p className="text-xs sm:text-sm text-muted uppercase">Total Scans</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex-1 bg-bg-card rounded-xl backdrop-blur-sm border-l-4 border-accent-rose flex flex-col gap-4 justify-center p-4 sm:p-6 min-h-0"
          >
            <div className="w-full flex items-center justify-between text-accent-rose">
              <BanIcon className="size-5" />
              <span className="text-xs font-semibold p-1 px-1.5 bg-accent-rose/20">
                CRITICAL
              </span>
            </div>
            <p className="text-2xl sm:text-4xl my-2 font-bold text-text-primary">
              {stats.threatsBlocked}
            </p>
            <p className="text-xs sm:text-sm text-muted uppercase">Threats Blocked</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex-1 bg-bg-card rounded-xl backdrop-blur-sm border-l-4 border-accent-amber flex flex-col gap-4 justify-center p-4 sm:p-6 min-h-0"
          >
            <div className="w-full flex items-center justify-between text-accent-amber">
              <ClockFadingIcon className="size-5" />
              <span className="text-xs font-semibold p-1 px-1.5 bg-accent-amber/20">
                UPTIME
              </span>
            </div>
            <p className="text-2xl sm:text-4xl my-2 font-bold text-text-primary">
              {stats.systemHealth}%
            </p>
            <p className="text-xs sm:text-sm text-muted uppercase">System Health</p>
          </motion.div>
        </div>
      </section>

      {/* Recent Analysis */}
      <section className="flex flex-col lg:flex-row w-full gap-6 lg:gap-6">
        <div className="flex flex-col gap-4 w-full lg:w-3/5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h2 className="text-lg sm:text-xl font-semibold text-text-primary">
              Recent Scan Analysis
            </h2>
            <Link
              href="/logs"
              className="text-xs font-semibold text-accent-blue hover:text-accent-blue/80 w-fit"
            >
              SEE FULL HISTORY
            </Link>
          </div>
          <div className="space-y-3">
            {recentLogs.map((log, i) => {
              const formatted = formatLog(log);
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`flex items-center gap-3 sm:gap-4 rounded-lg bg-bg-card p-3 sm:p-4`}
                >
                  <div className="p-2 sm:p-3 text-slate-400 flex-shrink-0">
                    {log.verdict === "unsafe" ? (
                      <BanIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : log.verdict === "suspicious" ? (
                      <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                      <ShieldCheckIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="truncate font-semibold text-text-primary lowercase first-letter:uppercase text-sm sm:text-base">
                      {formatted.title}
                    </h3>
                    <p className="truncate text-xs text-text-muted">
                      {formatted.subtitle}
                    </p>
                  </div>

                  <div
                    className={`rounded px-2 py-1 text-[10px] font-bold whitespace-nowrap ${
                      log.verdict === "unsafe"
                        ? "bg-danger/20 text-danger"
                        : log.verdict === "suspicious"
                          ? "bg-warning/20 text-warning"
                          : "bg-success/20 text-success"
                    }`}
                  >
                    {log.verdict === "unsafe"
                      ? "PHISH BLOCKED"
                      : log.verdict === "suspicious"
                        ? "SUSPICIOUS"
                        : "VERIFIED SAFE"}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
        <div className="w-full lg:w-2/5 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <h2 className="text-lg sm:text-xl font-semibold text-text-primary">
              Threat Trend Analysis
            </h2>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs tracking-widest">
              <div className="flex items-center gap-2">
                <span className="size-2 sm:size-3 rounded-full bg-accent-blue" />
                <span className="text-xs">NORMAL</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-2 sm:size-3 rounded-full bg-accent-rose" />
                <span className="text-xs">SPIKE</span>
              </div>
            </div>
          </div>
          <div className="w-full h-[24rem] sm:h-[28rem] lg:h-full">
            <ThreatsBarChart />
          </div>
        </div>
      </section>
    </main>
  );
}
