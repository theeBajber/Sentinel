"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Lock, Mail, ArrowRight, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        login(data.token, data.email);
      } else {
        const data = await res.json();
        setError(data.error || "Authentication failed");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800/50">
            <Shield className="h-8 w-8 text-accent-blue" />
          </div>
          <h1 className="text-2xl font-bold text-accent-blue">SENTINEL</h1>
          <p className="mt-2 text-sm text-slate-400 uppercase tracking-widest">
            Enter the Digital Bastion
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 space-y-4"
        >
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="mb-2 block text-xs font-medium text-slate-400 uppercase tracking-wider">
              Identity (Email)
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="agent@sentinel.net"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/50 py-3 pl-12 pr-4 text-white placeholder-slate-600 focus:border-accent-blue focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Access Key
              </label>
              <Link
                href="#"
                className="text-xs text-accent-rose hover:text-accent-rose/80"
              >
                Forgot Access?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/50 py-3 pl-12 pr-4 text-white placeholder-slate-600 focus:border-accent-blue focus:outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-linear-to-r bg-accent-blue py-4 text-sm font-bold text-bg-primary shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              "Initializing..."
            ) : (
              <>
                INITIALIZE PROTOCOL
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          <p className="text-center text-sm text-slate-500">
            New operative?{" "}
            <Link
              href="#"
              className="text-accent-blue hover:text-accent-blue/80 font-semibold"
            >
              Create Account
            </Link>
          </p>
        </form>

        <div className="mt-6 flex items-center justify-center gap-6 rounded-full border border-slate-800 bg-slate-900/50 px-6 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-success" />
            <span className="text-xs font-medium text-slate-400 uppercase">
              System: Armed
            </span>
          </div>
          <div className="h-4 w-px bg-slate-700" />
          <div className="flex items-center gap-2">
            <GlobeIcon className="h-3 w-3 text-accent-blue" />
            <span className="text-xs font-medium text-slate-400 uppercase">
              Global Mesh: Active
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function GlobeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}
