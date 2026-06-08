"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Download, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

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

const ITEMS_PER_PAGE = 10;

export default function Logs() {
  const { apiFetch } = useAuth();
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

      const res = await apiFetch(`/api/logs?${params.toString()}`);
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
        return "bg-danger";
      case "suspicious":
        return "bg-warning";
      case "safe":
        return "bg-success";
      default:
        return "bg-accent-blue";
    }
  };

  return (
    <main className="min-h-screen p-4 sm:p-6 max-w-4xl lg:max-w-310 w-full mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-8 w-full gap-4">
        <div>
          <p className="text-xs text-accent-blue uppercase font-semibold tracking-widest mb-2">
            Audit Layer
          </p>
          <h1 className="text-2xl sm:text-4xl font-bold mb-2 text-text-primary">
            Detection Logs
          </h1>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="rounded-xl w-full p-3 sm:p-4 mb-6 flex flex-col gap-4 bg-bg-card">
        {/* Filter Verdict and Date Range */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-end flex-wrap">
          {/* Filter Verdict */}
          <div className="flex flex-col gap-2 w-full sm:w-auto">
            <span className="text-xs uppercase tracking-wider text-muted">
              Filter Verdict
            </span>
            <div className="flex gap-1 flex-wrap">
              {["all", "safe", "suspicious", "unsafe"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f as any)}
                  className={`px-2 sm:px-4 py-1.5 rounded text-xs font-medium transition-all capitalize ${
                    filter === f
                      ? "bg-bg-hover text-accent-blue border-accent-blue"
                      : "bg-transparent text-text-muted border-bg-hover"
                  } border`}
                >
                  {f === "all" ? "All Activity" : f}
                </button>
              ))}
            </div>
          </div>
          {/* Date Range */}
          <div className="flex flex-col gap-2 w-full sm:w-auto">
            <span className="text-xs uppercase tracking-wider text-text-muted">
              Date Range (Start/End)
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-2 sm:px-4 py-1.5 rounded text-xs sm:text-sm outline-none bg-bg-primary/50 text-text-primary border-bg-hover border focus-within:border-accent-blue"
              />
              <span className="text-text-muted hidden sm:inline">→</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-2 sm:px-4 py-1.5 rounded text-xs sm:text-sm outline-none bg-bg-primary/50 text-text-primary border-bg-hover border focus-within:border-accent-blue"
              />
            </div>
          </div>
        </div>
        {/* Export Button */}
        <button
          onClick={exportCSV}
          className="flex items-center justify-center sm:justify-start text-bg-primary bg-accent-blue gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all hover:opacity-90 w-full sm:w-auto"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Logs Table - Desktop View */}
      <div className="rounded-xl overflow-hidden bg-bg-card hidden sm:block">
        <table className="w-full text-sm">
          {/* Header */}
          <thead className="text-xs uppercase tracking-wider text-text-muted border-b border-bg-hover">
            <tr>
              <th className="px-3 sm:px-6 py-4 text-left">Time</th>
              <th className="px-3 sm:px-6 py-4 text-left">URL / Destination</th>
              <th className="px-3 sm:px-6 py-4 text-left">Verdict</th>
              <th className="px-3 sm:px-6 py-4 text-left">Score</th>
              <th className="hidden lg:table-cell px-3 sm:px-6 py-4 text-left">Reasons</th>
              <th className="px-3 sm:px-6 py-4 text-right">Action</th>
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
                  className="border-b border-bg-hover hover:bg-bg-primary/40 text-xs sm:text-sm"
                >
                  {/* Time */}
                  <td className="px-3 sm:px-6 py-3 sm:py-4">
                    <p className="font-mono text-text-primary text-xs sm:text-sm">{time.time}</p>
                    <p className="text-xs text-text-muted">{time.date}</p>
                  </td>

                  {/* URL */}
                  <td className="px-3 sm:px-6 py-3 sm:py-4 font-mono text-text-primary max-w-32 sm:max-w-62 truncate text-xs sm:text-sm">
                    {log.url.replace(/^https?:\/\//, "")}
                  </td>

                  {/* Verdict */}
                  <td className="px-3 sm:px-6 py-3 sm:py-4">
                    <span
                      className={`px-2 sm:px-3 py-1 rounded text-xs font-bold uppercase ${
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
                  <td className="px-3 sm:px-6 py-3 sm:py-4">
                    <p className="font-mono text-text-primary mb-1 text-xs sm:text-sm">
                      {log.score.toString().padStart(2, "0")}
                    </p>
                    <div className="h-1 w-16 sm:w-full rounded-full bg-bg-hover">
                      <div
                        className={`h-full rounded-full ${scoreBarColor}`}
                        style={{
                          width: `${log.score}%`,
                        }}
                      />
                    </div>
                  </td>

                  {/* Reasons */}
                  <td className="hidden lg:table-cell px-3 sm:px-6 py-3 sm:py-4">
                    <div className="flex flex-wrap gap-1">
                      {reasons.slice(0, 2).map((r, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 rounded text-xs bg-bg-hover text-text-muted border border-bg-hover"
                        >
                          {r}
                        </span>
                      ))}
                      {reasons.length > 2 && (
                        <span className="text-xs text-text-muted">
                          +{reasons.length - 2}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Action */}
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                    <button className="p-1.5 sm:p-2 rounded hover:bg-bg-hover text-text-muted hover:text-text-primary transition">
                      <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
        <div className="px-3 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-t border-bg-hover text-xs sm:text-sm">
          <div className="text-text-muted">
            Showing {startIndex + 1}–
            {Math.min(startIndex + ITEMS_PER_PAGE, filteredLogs.length)} of{" "}
            {filteredLogs.length}
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="size-7 sm:size-8 flex items-center justify-center bg-bg-hover rounded disabled:opacity-30 text-xs"
            >
              <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>

            {getPageNumbers(currentPage, totalPages).map((p, i) =>
              p === "..." ? (
                <span key={i} className="text-text-muted px-1.5 sm:px-2">
                  ...
                </span>
              ) : (
                <button
                  key={i}
                  onClick={() => setCurrentPage(p)}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded text-xs ${
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
              className="size-7 sm:size-8 flex items-center justify-center bg-bg-hover rounded disabled:opacity-30 text-xs"
            >
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Logs Cards - Mobile View */}
      <div className="sm:hidden space-y-3">
        {paginatedLogs.length === 0 ? (
          <div
            className="rounded-lg p-6 text-center text-sm text-text-muted bg-bg-card"
          >
            No logs found
          </div>
        ) : (
          paginatedLogs.map((log, index) => {
            const time = formatTime(log.createdAt);
            const reasons = getReasonsArray(log.reasons);
            const scoreBarColor = getScoreBarColor(log.verdict);

            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="p-4 rounded-lg bg-bg-card border border-bg-hover"
              >
                <div className="space-y-3">
                  {/* Time and Verdict */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-text-muted">{time.date}</p>
                      <p className="font-mono text-sm text-text-primary mt-1">{time.time}</p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                        log.verdict === "safe"
                          ? "bg-success/20 text-success border border-success/30"
                          : log.verdict === "suspicious"
                            ? "bg-warning/20 text-warning border border-warning/30"
                            : "bg-danger/20 text-danger border border-danger/30"
                      }`}
                    >
                      {log.verdict}
                    </span>
                  </div>

                  {/* URL */}
                  <div>
                    <p className="text-xs text-text-muted uppercase tracking-wider">URL</p>
                    <p className="font-mono text-xs text-text-primary truncate mt-1">
                      {log.url.replace(/^https?:\/\//, "")}
                    </p>
                  </div>

                  {/* Score */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-text-muted uppercase tracking-wider">Risk Score</p>
                      <p className="font-mono text-xs text-text-primary">
                        {log.score.toString().padStart(2, "0")}
                      </p>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-bg-hover">
                      <div
                        className={`h-full rounded-full ${scoreBarColor}`}
                        style={{
                          width: `${log.score}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Reasons */}
                  {reasons.length > 0 && (
                    <div>
                      <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Reasons</p>
                      <div className="flex flex-wrap gap-1.5">
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
                            +{reasons.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })
        )}

        {/* Mobile Pagination */}
        {paginatedLogs.length > 0 && (
          <div className="flex flex-col gap-3 mt-6">
            <div className="text-xs text-text-muted text-center">
              Showing {startIndex + 1}–
              {Math.min(startIndex + ITEMS_PER_PAGE, filteredLogs.length)} of{" "}
              {filteredLogs.length}
            </div>

            <div className="flex items-center justify-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded bg-bg-hover disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1">
                {getPageNumbers(currentPage, totalPages).map((p, i) =>
                  p === "..." ? (
                    <span key={i} className="text-text-muted px-1">
                      ...
                    </span>
                  ) : (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(p)}
                      className={`w-7 h-7 rounded text-xs ${
                        currentPage === p
                          ? "bg-accent-blue text-bg-primary"
                          : "bg-bg-hover text-text-primary"
                      }`}
                    >
                      {p}
                    </button>
                  ),
                )}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded bg-bg-hover disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
