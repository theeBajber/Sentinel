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

const ITEMS_PER_PAGE = 15;

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

  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedLogs = filteredLogs.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  const getVerdictStyle = (verdict: string) => {
    switch (verdict) {
      case "unsafe":
        return { bg: "#5c1a1a", text: "#ffb4ab", border: "#7f2a2a" };
      case "suspicious":
        return { bg: "#3d2d1a", text: "#dec29a", border: "#5c4528" };
      case "safe":
        return { bg: "#1c2337", text: "#8fd4b2", border: "#2a3a5c" };
      default:
        return { bg: "#1c2337", text: COLORS.textMuted, border: "#2a3a5c" };
    }
  };

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
    <main
      className="min-h-screen p-6"
      style={{ backgroundColor: COLORS.bgPrimary }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: COLORS.textPrimary }}
          >
            Detection Logs
          </h1>
          <p style={{ color: COLORS.textMuted }}>
            Real-time analysis of incoming network traffic and file hash
            verification.
          </p>
        </div>
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm"
          style={{
            backgroundColor: COLORS.bgCard,
            color: COLORS.success,
            border: `1px solid ${COLORS.success}40`,
          }}
        >
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: COLORS.success }}
          ></span>
          LIVE MONITORING ACTIVE
        </div>
      </div>

      {/* Filters Bar */}
      <div
        className="rounded-xl p-4 mb-6 flex items-center gap-4 flex-wrap"
        style={{ backgroundColor: COLORS.bgCard }}
      >
        {/* Filter Verdict */}
        <div className="flex items-center gap-2">
          <span
            className="text-xs uppercase tracking-wider"
            style={{ color: COLORS.textMuted }}
          >
            Filter Verdict
          </span>
          <div className="flex gap-1">
            {["all", "safe", "suspicious", "unsafe"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className="px-4 py-2 rounded text-sm font-medium transition-all capitalize"
                style={{
                  backgroundColor:
                    filter === f ? COLORS.bgHover : "transparent",
                  color: filter === f ? COLORS.textPrimary : COLORS.textMuted,
                  border: `1px solid ${filter === f ? COLORS.accentBlue : COLORS.bgHover}`,
                }}
              >
                {f === "all" ? "All Activity" : f}
              </button>
            ))}
          </div>
        </div>

        <div
          className="w-px h-8"
          style={{ backgroundColor: COLORS.bgHover }}
        ></div>

        {/* Date Range */}
        <div className="flex items-center gap-2">
          <span
            className="text-xs uppercase tracking-wider"
            style={{ color: COLORS.textMuted }}
          >
            Date Range (Start/End)
          </span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 rounded text-sm outline-none"
            style={{
              backgroundColor: COLORS.bgHover,
              color: COLORS.textPrimary,
              border: `1px solid ${COLORS.bgHover}`,
            }}
          />
          <span style={{ color: COLORS.textMuted }}>→</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 rounded text-sm outline-none"
            style={{
              backgroundColor: COLORS.bgHover,
              color: COLORS.textPrimary,
              border: `1px solid ${COLORS.bgHover}`,
            }}
          />
        </div>

        <div className="flex-1"></div>

        {/* Export Button */}
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90"
          style={{
            backgroundColor: COLORS.bgHover,
            color: COLORS.textPrimary,
            border: `1px solid ${COLORS.bgHover}`,
          }}
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Logs Table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: COLORS.bgCard }}
      >
        {/* Table Header */}
        <div
          className="grid grid-cols-12 gap-4 px-6 py-4 text-xs font-semibold uppercase tracking-wider"
          style={{
            color: COLORS.textMuted,
            borderBottom: `1px solid ${COLORS.bgHover}`,
          }}
        >
          <div className="col-span-2">Time</div>
          <div className="col-span-4">URL / Destination</div>
          <div className="col-span-1">Verdict</div>
          <div className="col-span-1">Score</div>
          <div className="col-span-3">Reasons</div>
          <div className="col-span-1 text-right">Action</div>
        </div>

        {/* Table Body */}
        {loading ? (
          <div
            className="px-6 py-12 text-center"
            style={{ color: COLORS.textMuted }}
          >
            Loading logs...
          </div>
        ) : paginatedLogs.length === 0 ? (
          <div
            className="px-6 py-12 text-center"
            style={{ color: COLORS.textMuted }}
          >
            No logs found
          </div>
        ) : (
          paginatedLogs.map((log, index) => {
            const verdictStyle = getVerdictStyle(log.verdict);
            const time = formatTime(log.createdAt);
            const reasons = getReasonsArray(log.reasons);
            const scoreBarColor = getScoreBarColor(log.verdict);

            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.03 }}
                className="grid grid-cols-12 gap-4 px-6 py-4 items-center"
                style={{
                  borderBottom: `1px solid ${COLORS.bgHover}`,
                  backgroundColor:
                    index % 2 === 0 ? "transparent" : "rgba(28, 35, 55, 0.3)",
                }}
              >
                {/* Time */}
                <div className="col-span-2">
                  <div
                    className="font-mono text-sm"
                    style={{ color: COLORS.textPrimary }}
                  >
                    {time.time}
                  </div>
                  <div className="text-xs" style={{ color: COLORS.textMuted }}>
                    {time.date}
                  </div>
                </div>

                {/* URL */}
                <div className="col-span-4">
                  <div className="flex items-center gap-2">
                    <span style={{ color: COLORS.textMuted }}>
                      {log.url.startsWith("https") ? "🔒" : "🔗"}
                    </span>
                    <span
                      className="text-sm truncate font-mono"
                      style={{ color: COLORS.textPrimary }}
                    >
                      {log.url.replace(/^https?:\/\//, "").substring(0, 50)}
                      {log.url.length > 50 ? "..." : ""}
                    </span>
                  </div>
                </div>

                {/* Verdict Badge */}
                <div className="col-span-1">
                  <span
                    className="inline-block px-3 py-1 rounded text-xs font-bold uppercase"
                    style={{
                      backgroundColor: verdictStyle.bg,
                      color: verdictStyle.text,
                      border: `1px solid ${verdictStyle.border}`,
                    }}
                  >
                    {log.verdict}
                  </span>
                </div>

                {/* Score with Bar */}
                <div className="col-span-1">
                  <div
                    className="text-sm font-mono mb-1"
                    style={{ color: COLORS.textPrimary }}
                  >
                    {log.score.toString().padStart(2, "0")}
                  </div>
                  <div
                    className="h-1 w-full rounded-full"
                    style={{ backgroundColor: COLORS.bgHover }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${log.score}%`,
                        backgroundColor: scoreBarColor,
                      }}
                    />
                  </div>
                </div>

                {/* Reasons */}
                <div className="col-span-3 flex flex-wrap gap-1">
                  {reasons.slice(0, 3).map((reason, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 rounded text-xs"
                      style={{
                        backgroundColor: COLORS.bgHover,
                        color: COLORS.textMuted,
                        border: `1px solid ${COLORS.bgHover}`,
                      }}
                    >
                      {reason}
                    </span>
                  ))}
                  {reasons.length > 3 && (
                    <span
                      className="px-2 py-1 rounded text-xs"
                      style={{ color: COLORS.textMuted }}
                    >
                      +{reasons.length - 3}
                    </span>
                  )}
                </div>

                {/* Action - View Eye */}
                <div className="col-span-1 text-right">
                  <button
                    className="p-2 rounded transition-all hover:opacity-80"
                    style={{ color: COLORS.textMuted }}
                    title="View details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })
        )}

        {/* Pagination Footer */}
        {!loading && filteredLogs.length > 0 && (
          <div
            className="px-6 py-4 flex items-center justify-between"
            style={{ borderTop: `1px solid ${COLORS.bgHover}` }}
          >
            <div style={{ color: COLORS.textMuted }} className="text-sm">
              Showing {startIndex + 1}-
              {Math.min(startIndex + ITEMS_PER_PAGE, filteredLogs.length)} of{" "}
              {filteredLogs.length} logs
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded transition-all disabled:opacity-30"
                style={{
                  backgroundColor: COLORS.bgHover,
                  color: COLORS.textPrimary,
                }}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className="w-8 h-8 rounded text-sm font-medium transition-all"
                    style={{
                      backgroundColor:
                        currentPage === pageNum
                          ? COLORS.accentBlue
                          : COLORS.bgHover,
                      color:
                        currentPage === pageNum
                          ? COLORS.bgPrimary
                          : COLORS.textPrimary,
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}

              {totalPages > 5 && (
                <>
                  <span style={{ color: COLORS.textMuted }}>...</span>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    className="w-8 h-8 rounded text-sm font-medium transition-all"
                    style={{
                      backgroundColor:
                        currentPage === totalPages
                          ? COLORS.accentBlue
                          : COLORS.bgHover,
                      color:
                        currentPage === totalPages
                          ? COLORS.bgPrimary
                          : COLORS.textPrimary,
                    }}
                  >
                    {totalPages}
                  </button>
                </>
              )}

              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="p-2 rounded transition-all disabled:opacity-30"
                style={{
                  backgroundColor: COLORS.bgHover,
                  color: COLORS.textPrimary,
                }}
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
