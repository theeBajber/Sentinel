"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Download, Eye, ChevronLeft, ChevronRight } from "lucide-react";

interface Log {
  id: string;
  url: string;
  verdict: "safe" | "suspicious" | "unsafe";
  score: number;
  reasons: string;
  createdAt: string;
  clientIp?: string;
  source?: string;
}

const COLORS = {
  bgPrimary: "#0c1324",
  bgCard: "#191f31",
  bgHover: "#1c2337",
  accentBlue: "#b7c4ff",
  accentRose: "#ffb4ab",
  accentAmber: "#dec29a",
  textPrimary: "#dce1fb",
  textMuted: "#c6c6cd",
  danger: "#f2a7a0",
  warning: "#e6c38a",
  success: "#8fd4b2",
};

const ITEMS_PER_PAGE = 10;

export default function Logs() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "safe" | "suspicious" | "unsafe"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    fetchLogs();
  }, [filter, dateFrom, dateTo]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== "all") params.append("severity", filter);
      if (dateFrom) params.append("from", dateFrom);
      if (dateTo) params.append("to", dateTo);

      const res = await fetch(`/api/logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
        setCurrentPage(1);
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = ["Time", "URL", "Verdict", "Score", "Reasons"];
    const csvContent = [
      headers.join(","),
      ...filteredLogs.map((log) =>
        [
          new Date(log.createdAt).toLocaleString(),
          `"${log.url}"`,
          log.verdict,
          log.score,
          `"${log.reasons}"`,
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sentinel-logs-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const filteredLogs = logs.filter((log) => {
    if (filter === "all") return true;
    return log.verdict === filter;
  });
  function getPageNumbers(current: number, total: number) {
    const pages: (number | "...")[] = [];

    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    pages.push(1);

    if (current > 3) pages.push("...");

    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (current < total - 2) pages.push("...");

    pages.push(total);

    return pages;
  }

  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedLogs = filteredLogs.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  const getReasonsArray = (reasons: string) => {
    return reasons
      .split(",")
      .map((r) => r.trim())
      .filter((r) => r);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      time: date.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      date: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    };
  };

  const getScoreBarColor = (verdict: string) => {
    switch (verdict) {
      case "unsafe":
        return COLORS.danger;
      case "suspicious":
        return COLORS.warning;
      case "safe":
        return COLORS.success;
      default:
        return COLORS.accentBlue;
    }
  };

  return (
    <main className="min-h-screen p-6 max-w-310 w-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 w-full">
        <div>
          <p className="text-xs text-accent-blue uppercase font-semibold tracking-widest mb-2">
            Audit Layer
          </p>
          <h1 className="text-4xl font-bold mb-2 text-text-primary">
            Detection Logs
          </h1>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="rounded-xl h-25 w-full p-4 mb-6 flex justify-between items-center gap-4 flex-wrap bg-bg-card">
        {/* Filter Verdict */}
        <div className="flex gap-6 items-center">
          <div className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-wider text-muted">
              Filter Verdict
            </span>
            <div className="flex gap-1">
              {["all", "safe", "suspicious", "unsafe"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f as any)}
                  className="px-4 py-1.5 rounded text-xs font-medium transition-all capitalize"
                  style={{
                    backgroundColor:
                      filter === f ? COLORS.bgHover : "transparent",
                    color: filter === f ? COLORS.accentBlue : COLORS.textMuted,
                    border: `1px solid ${filter === f ? COLORS.accentBlue : COLORS.bgHover}`,
                  }}
                >
                  {f === "all" ? "All Activity" : f}
                </button>
              ))}
            </div>
          </div>
          {/* Date Range */}
          <div className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-wider text-text-muted">
              Date Range (Start/End)
            </span>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-4 py-1.5 rounded text-sm outline-none bg-bg-primary/50 text-text-primary min-w-50 border-bg-hover border focus-within:border-accent-blue"
              />
              <span className="text-text-muted">→</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-2 py-1 rounded text-sm outline-none bg-bg-primary/50 text-text-primary min-w-50 border-bg-hover border focus-within:border-accent-blue"
              />
            </div>
          </div>
        </div>
        {/* Export Button */}
        <button
          onClick={exportCSV}
          className="flex items-center text-bg-primary bg-accent-blue gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Logs Table */}
      <div className="rounded-xl overflow-hidden bg-bg-card">
        <table className="w-full text-sm">
          {/* Header */}
          <thead className="text-xs uppercase tracking-wider text-text-muted border-b border-bg-hover">
            <tr>
              <th className="px-6 py-4 text-left">Time</th>
              <th className="px-6 py-4 text-left">URL / Destination</th>
              <th className="px-6 py-4 text-left">Verdict</th>
              <th className="px-6 py-4 text-left">Score</th>
              <th className="px-6 py-4 text-left">Reasons</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {paginatedLogs.map((log, index) => {
              const time = formatTime(log.createdAt);
              const reasons = getReasonsArray(log.reasons);
              const scoreBarColor = getScoreBarColor(log.verdict);

              return (
                <motion.tr
                  key={log.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.03 }}
                  className="border-b border-bg-hover hover:bg-bg-primary/40"
                >
                  {/* Time */}
                  <td className="px-6 py-4">
                    <p className="font-mono text-text-primary">{time.time}</p>
                    <p className="text-xs text-text-muted">{time.date}</p>
                  </td>

                  {/* URL */}
                  <td className="px-6 py-4 font-mono text-text-primary max-w-62.5 truncate">
                    {log.url.replace(/^https?:\/\//, "")}
                  </td>

                  {/* Verdict */}
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded text-xs font-bold uppercase ${
                        log.verdict === "safe"
                          ? "bg-success/20 text-success border border-success/30"
                          : log.verdict === "suspicious"
                            ? "bg-warning/20 text-warning border border-warning/30"
                            : "bg-danger/20 text-danger border border-danger/30"
                      }`}
                    >
                      {log.verdict}
                    </span>
                  </td>

                  {/* Score */}
                  <td className="px-6 py-4">
                    <p className="font-mono text-text-primary mb-1">
                      {log.score.toString().padStart(2, "0")}
                    </p>
                    <div className="h-1 w-full rounded-full bg-bg-hover">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${log.score}%`,
                          backgroundColor: scoreBarColor,
                        }}
                      />
                    </div>
                  </td>

                  {/* Reasons */}
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {reasons.slice(0, 3).map((r, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 rounded text-xs bg-bg-hover text-text-muted border border-bg-hover"
                        >
                          {r}
                        </span>
                      ))}
                      {reasons.length > 3 && (
                        <span className="text-xs text-text-muted">
                          +{reasons.length - 3}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Action */}
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 rounded hover:bg-bg-hover text-text-muted hover:text-text-primary transition">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
        <div className="px-6 py-4 flex justify-between items-center border-t border-bg-hover">
          <div className="text-sm text-text-muted">
            Showing {startIndex + 1}–
            {Math.min(startIndex + ITEMS_PER_PAGE, filteredLogs.length)} of{" "}
            {filteredLogs.length}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="size-8 flex items-center justify-center bg-bg-hover rounded disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {getPageNumbers(currentPage, totalPages).map((p, i) =>
              p === "..." ? (
                <span key={i} className="text-text-muted px-2">
                  ...
                </span>
              ) : (
                <button
                  key={i}
                  onClick={() => setCurrentPage(p)}
                  className={`w-8 h-8 rounded text-sm ${
                    currentPage === p
                      ? "bg-accent-blue text-bg-primary"
                      : "bg-bg-hover text-text-primary"
                  }`}
                >
                  {p}
                </button>
              ),
            )}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="size-8 flex items-center justify-center bg-bg-hover rounded disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
