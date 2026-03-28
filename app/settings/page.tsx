// app/settings/page.tsx
"use client";

import { useState } from "react";
import { Bell, ShieldCheck, Key, ChevronRight, GlobeIcon } from "lucide-react";

export default function Settings() {
  const [notifications, setNotifications] = useState(true);
  const [realTimeScan, setRealTimeScan] = useState(true);
  const [strictMode, setStrictMode] = useState(false);

  return (
    <main className="p-6 w-full">
      <h1 className="mb-6 text-2xl font-bold text-white">Settings</h1>

      <section className="mb-6">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Protection
        </h2>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/30 overflow-hidden">
          <ToggleItem
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Real-time Scanning"
            description="Monitor all browsing activity"
            enabled={realTimeScan}
            onChange={setRealTimeScan}
          />
          <div className="h-px bg-slate-800" />
          <ToggleItem
            icon={<Key className="h-5 w-5" />}
            title="Strict Mode"
            description="Block suspicious sites immediately"
            enabled={strictMode}
            onChange={setStrictMode}
          />
        </div>
      </section>

      <section className="mb-6">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Notifications
        </h2>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/30 overflow-hidden">
          <ToggleItem
            icon={<Bell className="h-5 w-5" />}
            title="Threat Alerts"
            description="Notify when threats are detected"
            enabled={notifications}
            onChange={setNotifications}
          />
        </div>
      </section>

      <section className="mb-6">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Integration
        </h2>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/30 overflow-hidden">
          <button className="flex w-full items-center justify-between p-4 hover:bg-slate-800/50">
            <div className="flex items-center gap-3">
              <GlobeIcon className="h-5 w-5 text-slate-400" />
              <div className="text-left">
                <p className="font-medium text-white">API Keys</p>
                <p className="text-xs text-slate-500">Manage access tokens</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-500" />
          </button>
        </div>
      </section>

      <section className="text-center">
        <p className="text-xs text-slate-600">Sentinel v1.0.0</p>
        <p className="mt-1 text-xs text-slate-600">© 2026 Security Team</p>
      </section>
    </main>
  );
}

function ToggleItem({
  icon,
  title,
  description,
  enabled,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center gap-3">
        <div className="text-slate-400">{icon}</div>
        <div>
          <p className="font-medium text-white">{title}</p>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative h-6 w-11 rounded-full transition-colors ${
          enabled ? "bg-blue-600" : "bg-slate-700"
        }`}
      >
        <span
          className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform ${
            enabled ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
