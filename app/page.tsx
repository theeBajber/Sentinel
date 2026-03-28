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
      const res = await fetch("/api/stats");
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
      const res = await fetch("/api/logs?limit=4");
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
      const res = await fetch("/api/scan-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();
      setResult(data);
      fetchRecentLogs(); // Refresh logs
      fetchStats(); // Refresh stats
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
      time: new Date(log.createdAt).toRelativeTime
        ? new Date(log.createdAt).toRelativeTime()
        : new Date(log.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
    };
  };

  return (
    <main className="flex flex-col gap-6 max-w-310 w-full items-center p-6">
      {/* Hero Card with Scan Input */}
      <section className="flex items-center gap-6 w-full h-120 flex-col md:flex-row">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative flex flex-col w-2/3 p-6 rounded-xl bg-bg-card h-full"
        >
          <div className="flex w-full flex-col">
            <div className="flex w-full items-center justify-between">
              <p className="text-xs text-text-primary uppercase tracking-widest">
                Current Protection Status
              </p>
              <div className="rounded-full bg-accent-blue size-3 animate-pulse" />
            </div>
            <h1 className="my-4 text-6xl font-bold text-text-primary">
              System Secure
            </h1>
            <p className="leading-relaxed text-lg text-text-muted">
              No active threats detected. All real-time interception layers are
              active and monitoring incoming protocols.
            </p>
          </div>
          <div className="w-full">
            {/* Scan Input */}
            <form onSubmit={handleScan} className="mt-6">
              <div className="flex px-4 h-16 bg-bg-primary/50 rounded-xl w-full items-center">
                <Link2 className="h-5 w-5 text-accent-blue" />
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
                  className="rounded-lg bg-accent-blue/90  text-sm font-semibold text-bg-primary transition-all hover:bg-accent-blue disabled:opacity-80 disabled:cursor-not-allowed flex items-center gap-2 h-[70%] px-2"
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
                        <div className="flex items-center justify-between">
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
        <div className="flex flex-col gap-4 h-full w-[35%]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="h-1/3 bg-bg-card rounded-xl backdrop-blur-sm border-l-4 border-accent-blue flex-col gap-4 justify-center p-6"
          >
            <div className="w-full flex items-center justify-between text-accent-blue">
              <RadarIcon />
              <span className="text-xs font-semibold p-1 px-1.5 bg-accent-blue/20">
                LAST 24H
              </span>
            </div>
            <p className="text-4xl my-2 font-bold text-text-primary">
              {stats.totalScans.toLocaleString()}
            </p>
            <p className="text-sm text-muted uppercase">Total Scans</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="h-1/3 bg-bg-card rounded-xl backdrop-blur-sm border-l-4 border-accent-rose flex-col gap-4 justify-center p-6"
          >
            <div className="w-full flex items-center justify-between text-accent-rose">
              <BanIcon />
              <span className="text-xs font-semibold p-1 px-1.5 bg-accent-rose/20">
                CRITICAL
              </span>
            </div>
            <p className="text-4xl my-2 font-bold text-text-primary">
              {stats.threatsBlocked}
            </p>
            <p className="text-sm text-muted uppercase">Threats Blocked</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="h-1/3 bg-bg-card rounded-xl backdrop-blur-sm border-l-4 border-accent-amber flex-col gap-4 justify-center p-6"
          >
            <div className="w-full flex items-center justify-between text-accent-amber">
              <ClockFadingIcon />
              <span className="text-xs font-semibold p-1 px-1.5 bg-accent-amber/20">
                UPTIME
              </span>
            </div>
            <p className="text-4xl my-2 font-bold text-text-primary">
              {stats.systemHealth}%
            </p>
            <p className="text-sm text-muted uppercase">System Health</p>
          </motion.div>
        </div>
      </section>

      {/* Recent Analysis */}
      <section className="flex w-full items-center h-98 gap-6 ">
        <div className="flex flex-col gap-4 h-full w-3/5">
          <div className="flex items-center justify-between w-full">
            <h2 className="text-xl font-semibold text-text-primary">
              Recent Scan Analysis
            </h2>
            <Link
              href="/logs"
              className="text-xs font-semibold text-accent-blue hover:text-accent-blue/80"
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
                  className={`flex items-center gap-4 rounded-lg bg-bg-card p-4`}
                >
                  <div className="p-3 text-slate-400">
                    {log.verdict === "unsafe" ? (
                      <BanIcon className="h-5 w-5" />
                    ) : log.verdict === "suspicious" ? (
                      <AlertTriangle className="h-5 w-5" />
                    ) : (
                      <ShieldCheckIcon className="h-5 w-5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="truncate font-semibold text-text-primary lowercase first-letter:uppercase">
                      {formatted.title}
                    </h3>
                    <p className="truncate text-xs text-text-muted">
                      {formatted.subtitle}
                    </p>
                  </div>

                  <div
                    className={`rounded px-2 py-1 text-[10px] font-bold ${
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
        <div className="w-2/5 h-full flex flex-col gap-4">
          <div className="flex items-center justify-between w-full">
            <h2 className="text-xl font-semibold text-text-primary">
              Threat Trend Analysis
            </h2>
            <div className="flex items-center gap-4 text-xs tracking-widest">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-accent-blue" />
                <span>NORMAL</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-accent-rose" />
                <span>SPIKE</span>
              </div>
            </div>
          </div>
          <div className="w-full h-full">
            <ThreatsBarChart />
          </div>
        </div>
      </section>
    </main>
  );
}
