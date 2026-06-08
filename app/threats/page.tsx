"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface Threat {
  id: string;
  pattern: string;
  severity: "low" | "medium" | "high" | "critical";
  source: string;
  notes: string | null;
  isRegex: boolean;
  category: string | null;
  createdAt: string;
}

export default function Threats() {
  const { apiFetch } = useAuth();
  const [threats, setThreats] = useState<Threat[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    pattern: "",
    isRegex: false,
    severity: "high" as Threat["severity"],
    notes: "",
  });

  useEffect(() => {
    fetchThreats();
  }, []);

  const fetchThreats = async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/api/threats");
      if (res.ok) {
        const data = await res.json();
        setThreats(data);
      }
    } catch (error) {
      console.error("Failed to fetch threats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.pattern.trim()) return;

    try {
      const res = await apiFetch("/api/threats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          source: "manual",
        }),
      });

      if (res.ok) {
        setFormData({
          pattern: "",
          isRegex: false,
          severity: "high",
          notes: "",
        });
        fetchThreats();
      }
    } catch (error) {
      console.error("Failed to add threat:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this threat pattern?")) return;

    try {
      const res = await apiFetch(`/api/threats?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchThreats();
      }
    } catch (error) {
      console.error("Failed to delete threat:", error);
    }
  };

  const getSeverityClasses = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-900/50 text-accent-rose border-red-700";
      case "high":
        return "bg-red-800/50 text-danger border-red-600";
      case "medium":
        return "bg-yellow-900/50 text-accent-amber border-yellow-700";
      default:
        return "bg-blue-900/50 text-accent-blue border-blue-700";
    }
  };

  return (
    <main className="min-h-screen w-full p-4 sm:p-6 max-w-4xl lg:max-w-310 mx-auto">
      {/* Header */}
      <div className="mb-8">
        <p
          className="text-xs font-semibold tracking-widest uppercase mb-2 text-accent-blue"
        >
          Surveillance Module
        </p>
        <h1
          className="text-2xl sm:text-4xl font-bold text-text-primary"
        >
          Threat Management
        </h1>
      </div>

      {/* Add Threat Form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-xl p-4 sm:p-6 mb-6 bg-bg-card"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4 items-end">
          {/* Pattern Input */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-4">
            <label
              className="block text-xs font-medium uppercase tracking-wider mb-2 text-text-muted"
            >
              Pattern (Domain or Regex)
            </label>
            <input
              type="text"
              value={formData.pattern}
              onChange={(e) =>
                setFormData({ ...formData, pattern: e.target.value })
              }
              placeholder="e.g. example\.com"
              className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg outline-none transition-all bg-bg-primary/50 text-text-primary border border-bg-hover focus:border-accent-blue text-sm"
            />
          </div>

          {/* Regex Checkbox */}
          <div className="col-span-1 flex items-end justify-start sm:justify-center pb-0 sm:pb-0">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isRegex}
                onChange={(e) =>
                  setFormData({ ...formData, isRegex: e.target.checked })
                }
                className={`w-4 h-4 rounded cursor-pointer not-checked:appearance-none bg-bg-primary/50 accent-accent-blue`}
              />
              <span className="text-xs sm:text-sm text-text-muted">
                Regex
              </span>
            </label>
          </div>

          {/* Severity Dropdown */}
          <div className="col-span-1 sm:col-span-1 lg:col-span-2">
            <label
              className="block text-xs font-medium uppercase tracking-wider mb-2 text-text-muted"
            >
              Severity
            </label>
            <select
              value={formData.severity}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  severity: e.target.value as Threat["severity"],
                })
              }
              className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg appearance-none outline-none cursor-pointer text-text-primary border border-bg-hover bg-bg-primary text-sm"
            >
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Notes Input */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-3">
            <label
              className="block text-xs font-medium uppercase tracking-wider mb-2 text-text-muted"
            >
              Notes
            </label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Add context..."
              className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg outline-none transition-all bg-bg-primary/50 text-text-primary border border-bg-hover focus:border-accent-blue text-sm"
            />
          </div>

          {/* Add Button */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-2">
            <button
              type="submit"
              className="w-full py-2 sm:py-3 px-4 sm:px-6 rounded-lg font-semibold transition-all hover:opacity-90 text-sm bg-accent-blue text-bg-primary"
            >
              Add
            </button>
          </div>
        </div>
      </form>

      {/* Threats Table - Desktop View */}
      <div
        className="rounded-xl overflow-hidden hidden sm:block bg-bg-card"
      >
        {/* Table Header */}
        <div
          className="grid grid-cols-12 gap-4 px-4 sm:px-6 py-4 text-xs font-semibold uppercase tracking-wider text-accent-blue border-b border-bg-hover"
        >
          <div className="col-span-4">Pattern</div>
          <div className="col-span-1 text-center">Regex</div>
          <div className="col-span-2">Severity</div>
          <div className="col-span-4">Notes</div>
          <div className="col-span-1 text-right">Action</div>
        </div>

        {/* Table Body */}
        {loading ? (
          <div
            className="px-4 sm:px-6 py-12 text-center text-sm text-text-muted"
          >
            Loading threats...
          </div>
        ) : threats.length === 0 ? (
          <div
            className="px-4 sm:px-6 py-12 text-center text-sm text-text-muted"
          >
            No threat patterns defined yet
          </div>
        ) : (
          threats.map((threat, index) => {
            const severityClasses = getSeverityClasses(threat.severity);
            return (
              <motion.div
                key={threat.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`grid grid-cols-12 gap-4 px-4 sm:px-6 py-4 items-center text-sm border-b border-bg-hover ${
                  index % 2 === 0 ? "" : "bg-bg-hover/30"
                }`}
              >
                {/* Pattern */}
                <div
                  className="col-span-4 font-mono truncate text-text-primary"
                >
                  {threat.pattern}
                </div>

                {/* Regex Checkmark */}
                <div className="col-span-1 text-center">
                  {threat.isRegex && (
                    <span className="text-accent-blue">✓</span>
                  )}
                </div>

                {/* Severity Badge */}
                <div className="col-span-2">
                  <span
                    className={`inline-block px-2 sm:px-3 py-1 rounded text-xs font-bold uppercase ${severityClasses}`}
                  >
                    {threat.severity}
                  </span>
                </div>

                {/* Notes */}
                <div
                  className="col-span-4 truncate text-text-muted"
                >
                  {threat.notes || "—"}
                </div>

                {/* Delete Action */}
                <div className="col-span-1 text-right">
                  <button
                    onClick={() => handleDelete(threat.id)}
                    className="px-2 py-1 rounded text-xs font-medium transition-all hover:opacity-80 text-danger bg-transparent"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Threats Table - Mobile View (Card Layout) */}
      <div className="block sm:hidden space-y-3">
        {loading ? (
          <div
            className="px-4 py-12 text-center text-sm rounded-xl text-text-muted bg-bg-card"
          >
            Loading threats...
          </div>
        ) : threats.length === 0 ? (
          <div
            className="px-4 py-12 text-center text-sm rounded-xl text-text-muted bg-bg-card"
          >
            No threat patterns defined yet
          </div>
        ) : (
          threats.map((threat, index) => {
            const severityClasses = getSeverityClasses(threat.severity);
            return (
              <motion.div
                key={threat.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 rounded-lg bg-bg-card border border-bg-hover"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-xs uppercase tracking-wider text-accent-blue">Pattern</p>
                      <p className="font-mono text-sm truncate mt-1 text-text-primary">
                        {threat.pattern}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(threat.id)}
                      className="p-2 rounded transition-all hover:opacity-80 flex-shrink-0 text-danger bg-transparent"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-accent-blue">Severity</p>
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-bold uppercase mt-1 ${severityClasses}`}
                      >
                        {threat.severity}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-accent-blue">Regex</p>
                      <p className={`mt-1 ${threat.isRegex ? "text-accent-blue" : "text-text-muted"}`}>
                        {threat.isRegex ? "✓ Yes" : "— No"}
                      </p>
                    </div>
                  </div>

                  {threat.notes && (
                    <div>
                      <p className="text-xs uppercase tracking-wider text-accent-blue">Notes</p>
                      <p className="text-sm mt-1 truncate text-text-muted">
                        {threat.notes}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Reload Button */}
      <button
        onClick={fetchThreats}
        className="mt-6 flex items-center justify-center gap-2 mx-auto px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm font-medium transition-all hover:opacity-80 text-text-muted bg-transparent border border-bg-hover"
      >
        <RefreshCw className="w-4 h-4" />
        Reload Threat Rules
      </button>
    </main>
  );
}