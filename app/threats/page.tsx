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

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case "critical":
        return { bg: "#5c1a1a", text: "#ffb4ab", border: "#7f2a2a" };
      case "high":
        return { bg: "#4a1c1c", text: "#f2a7a0", border: "#5c2a2a" };
      case "medium":
        return { bg: "#3d2d1a", text: "#dec29a", border: "#5c4528" };
      default:
        return { bg: "#1c2337", text: "#b7c4ff", border: "#2a3a5c" };
    }
  };

  return (
    <main className="min-h-screen w-full p-6 max-w-310 items-center">
      {/* Header */}
      <div className="mb-8">
        <p
          className="text-xs font-semibold tracking-widest uppercase mb-2"
          style={{ color: COLORS.accentBlue }}
        >
          Surveillance Module
        </p>
        <h1
          className="text-4xl font-bold"
          style={{ color: COLORS.textPrimary }}
        >
          Threat Management
        </h1>
      </div>

      {/* Add Threat Form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-xl p-4 mb-6"
        style={{ backgroundColor: COLORS.bgCard }}
      >
        <div className="grid grid-cols-12 gap-4 items-end">
          {/* Pattern Input */}
          <div className="col-span-4">
            <label
              className="block text-xs font-medium uppercase tracking-wider mb-2"
              style={{ color: COLORS.textMuted }}
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
              className="w-full px-4 py-3 rounded-lg outline-none transition-all bg-bg-primary/50 text-text-primary border border-bg-hover"
              onFocus={(e) => (e.target.style.borderColor = COLORS.accentBlue)}
              onBlur={(e) => (e.target.style.borderColor = COLORS.bgHover)}
            />
          </div>

          {/* Regex Checkbox */}
          <div className="col-span-1 flex items-center justify-center pb-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isRegex}
                onChange={(e) =>
                  setFormData({ ...formData, isRegex: e.target.checked })
                }
                className={`w-4 h-4 rounded cursor-pointer not-checked:appearance-none bg-bg-primary/50 accent-accent-blue`}
              />
              <span className="text-sm" style={{ color: COLORS.textMuted }}>
                Regex
              </span>
            </label>
          </div>

          {/* Severity Dropdown */}
          <div className="col-span-2">
            <label
              className="block text-xs font-medium uppercase tracking-wider mb-2"
              style={{ color: COLORS.textMuted }}
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
              className="w-full px-4 py-3 rounded-lg appearance-none outline-none cursor-pointer text-text-primary border border-bg-hover"
              style={{
                backgroundColor: "#12192a",
              }}
            >
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Notes Input */}
          <div className="col-span-3">
            <label
              className="block text-xs font-medium uppercase tracking-wider mb-2"
              style={{ color: COLORS.textMuted }}
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
              className="w-full px-4 py-3 rounded-lg outline-none transition-all bg-bg-primary/50 text-text-primary border border-bg-hover"
              onFocus={(e) => (e.target.style.borderColor = COLORS.accentBlue)}
              onBlur={(e) => (e.target.style.borderColor = COLORS.bgHover)}
            />
          </div>

          {/* Add Button */}
          <div className="col-span-2">
            <button
              type="submit"
              className="w-full py-3 px-6 rounded-lg font-semibold transition-all hover:opacity-90"
              style={{
                backgroundColor: COLORS.accentBlue,
                color: COLORS.bgPrimary,
              }}
            >
              Add
            </button>
          </div>
        </div>
      </form>

      {/* Threats Table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: COLORS.bgCard }}
      >
        {/* Table Header */}
        <div
          className="grid grid-cols-12 gap-4 px-6 py-4 text-xs font-semibold uppercase tracking-wider"
          style={{
            color: COLORS.accentBlue,
            borderBottom: `1px solid ${COLORS.bgHover}`,
          }}
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
            className="px-6 py-12 text-center"
            style={{ color: COLORS.textMuted }}
          >
            Loading threats...
          </div>
        ) : threats.length === 0 ? (
          <div
            className="px-6 py-12 text-center"
            style={{ color: COLORS.textMuted }}
          >
            No threat patterns defined yet
          </div>
        ) : (
          threats.map((threat, index) => {
            const severityStyle = getSeverityStyle(threat.severity);
            return (
              <motion.div
                key={threat.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="grid grid-cols-12 gap-4 px-6 py-4 items-center"
                style={{
                  borderBottom: `1px solid ${COLORS.bgHover}`,
                  backgroundColor:
                    index % 2 === 0 ? "transparent" : "rgba(28, 35, 55, 0.3)",
                }}
              >
                {/* Pattern */}
                <div
                  className="col-span-4 font-mono text-sm truncate"
                  style={{ color: COLORS.textPrimary }}
                >
                  {threat.pattern}
                </div>

                {/* Regex Checkmark */}
                <div className="col-span-1 text-center">
                  {threat.isRegex && (
                    <span style={{ color: COLORS.accentBlue }}>✓</span>
                  )}
                </div>

                {/* Severity Badge */}
                <div className="col-span-2">
                  <span
                    className="inline-block px-3 py-1 rounded text-xs font-bold uppercase"
                    style={{
                      backgroundColor: severityStyle.bg,
                      color: severityStyle.text,
                      border: `1px solid ${severityStyle.border}`,
                    }}
                  >
                    {threat.severity}
                  </span>
                </div>

                {/* Notes */}
                <div
                  className="col-span-4 text-sm truncate"
                  style={{ color: COLORS.textMuted }}
                >
                  {threat.notes || "—"}
                </div>

                {/* Delete Action */}
                <div className="col-span-1 text-right">
                  <button
                    onClick={() => handleDelete(threat.id)}
                    className="px-3 py-1 rounded text-xs font-medium transition-all hover:opacity-80"
                    style={{
                      backgroundColor: "transparent",
                      color: COLORS.danger,
                    }}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Reload Button */}
      <button
        onClick={fetchThreats}
        className="mt-6 flex items-center justify-center gap-2 mx-auto px-6 py-3 rounded-lg text-sm font-medium transition-all hover:opacity-80"
        style={{
          backgroundColor: "transparent",
          color: COLORS.textMuted,
          border: `1px solid ${COLORS.bgHover}`,
        }}
      >
        <RefreshCw className="w-4 h-4" />
        Reload Threat Rules
      </button>
    </main>
  );
}
