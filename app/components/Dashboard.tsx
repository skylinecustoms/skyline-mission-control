"use client";

import { useEffect, useMemo, useState } from "react";
import { formatTime, getPollingIntervalMs, getPollingWindow } from "../lib/time";

type StatusResponse = {
  updatedAt: string;
  haikuModel: string;
  activeAutomations: { name: string; nextRun: string }[];
  currentTasks: string[];
  completedToday: string[];
  systemHealth: { name: string; status: "ok" | "warning" | "issue" }[];
  integrationNotes: Record<string, string>;
};

const statusStyles: Record<"ok" | "warning" | "issue", string> = {
  ok: "bg-mc-emerald shadow-soft-glow",
  warning: "bg-mc-amber shadow-ember-glow",
  issue: "bg-mc-ember shadow-ember-glow",
};

export default function Dashboard() {
  const [data, setData] = useState<StatusResponse | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [nextUpdate, setNextUpdate] = useState<Date | null>(null);
  const [windowLabel, setWindowLabel] = useState<"working" | "overnight">(
    getPollingWindow(new Date())
  );

  const loadStatus = async () => {
    const response = await fetch("/api/status", { cache: "no-store" });
    const payload = (await response.json()) as StatusResponse;
    setData(payload);
    const updated = new Date(payload.updatedAt);
    const now = new Date();
    const intervalMs = getPollingIntervalMs(now);
    setLastUpdated(updated);
    setNextUpdate(new Date(now.getTime() + intervalMs));
    setWindowLabel(getPollingWindow(now));
  };

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const schedule = async () => {
      await loadStatus();
      const intervalMs = getPollingIntervalMs(new Date());
      timeoutId = setTimeout(schedule, intervalMs);
    };

    schedule();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  const heartbeatLabel = useMemo(() => {
    return windowLabel === "working"
      ? "Working hours sync every 5 minutes"
      : "Overnight sync every 3 hours";
  }, [windowLabel]);

  return (
    <div className="min-h-screen bg-grid">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pb-16 pt-10 md:px-8">
        <header className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-muted">
                Skyline Customs
              </p>
              <h1 className="text-5xl font-semibold uppercase tracking-[0.08em] text-white md:text-6xl">
                Mission Control
              </h1>
            </div>
            <div className="hidden flex-col items-end gap-1 md:flex">
              <span className="text-xs uppercase tracking-[0.28em] text-muted">
                Powered by Haiku
              </span>
              <span className="text-sm text-white/80">{data?.haikuModel ?? "Haiku"}</span>
            </div>
          </div>
          <div className="glass-card rounded-2xl px-4 py-4 text-sm text-white/80 shadow-soft-glow md:px-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-[0.2em] text-muted">
                  Smart Update Interval
                </span>
                <span className="text-base font-medium text-white">{heartbeatLabel}</span>
              </div>
              <div className="flex flex-col items-start gap-1 md:items-end">
                <span className="text-xs text-muted">Last sync</span>
                <span className="text-base">
                  {lastUpdated ? formatTime(lastUpdated) : "Connecting"}
                </span>
                <span className="text-xs text-muted">
                  Next update {nextUpdate ? formatTime(nextUpdate) : "calculating"}
                </span>
              </div>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="glass-card animate-float-in rounded-3xl p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-semibold uppercase tracking-[0.18em] text-white">
                Active Automations
              </h2>
              <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs uppercase tracking-[0.2em] text-emerald-200">
                Live
              </span>
            </div>
            <ul className="flex flex-col gap-4 text-sm">
              {data?.activeAutomations?.map((item) => (
                <li key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="status-dot bg-mc-emerald animate-soft-pulse" />
                    <span className="text-base text-white">{item.name}</span>
                  </div>
                  <span className="text-muted">Next: {item.nextRun}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="glass-card animate-float-in rounded-3xl p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-semibold uppercase tracking-[0.18em] text-white">
                Current Tasks
              </h2>
              <span className="rounded-full bg-mc-ice/15 px-3 py-1 text-xs uppercase tracking-[0.2em] text-mc-ice">
                Running
              </span>
            </div>
            <ul className="flex flex-col gap-3 text-base text-white/90">
              {data?.currentTasks?.map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="text-lg">⚡</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="glass-card animate-float-in rounded-3xl p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-semibold uppercase tracking-[0.18em] text-white">
                Completed Today
              </h2>
              <span className="rounded-full bg-mc-emerald/15 px-3 py-1 text-xs uppercase tracking-[0.2em] text-mc-emerald">
                Complete
              </span>
            </div>
            <ul className="flex flex-col gap-3 text-base text-white/90">
              {data?.completedToday?.map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="text-lg">✅</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="glass-card animate-float-in rounded-3xl p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-semibold uppercase tracking-[0.18em] text-white">
                System Health
              </h2>
              <span className="rounded-full bg-mc-ember/15 px-3 py-1 text-xs uppercase tracking-[0.2em] text-mc-ember">
                Watchlist
              </span>
            </div>
            <ul className="flex flex-col gap-4 text-base text-white/90">
              {data?.systemHealth?.map((item) => (
                <li key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`status-dot ${statusStyles[item.status]}`} />
                    <span>{item.name}</span>
                  </div>
                  <span className="text-muted">
                    {item.status === "warning" ? "⚠️" : "✅"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="glass-card rounded-3xl p-6 text-sm text-white/80">
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-semibold uppercase tracking-[0.18em] text-white">
              Live Integrations
            </h2>
            <span className="text-xs uppercase tracking-[0.28em] text-muted">
              Real-time data feeds
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 text-base md:grid-cols-2">
            {data?.integrationNotes &&
              Object.entries(data.integrationNotes).map(([key, value]) => (
                <div key={key} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="text-sm uppercase tracking-[0.2em] text-muted">
                    {key.replace(/([A-Z])/g, " $1")}
                  </p>
                  <p className="text-base text-white/90">{value}</p>
                </div>
              ))}
          </div>
        </section>

        <footer className="flex flex-col items-start gap-2 text-xs text-muted md:flex-row md:items-center md:justify-between">
          <span>Mobile-optimized for iPhone. Tap any card for detail views.</span>
          <span>Automation updates routed through Haiku for cost efficiency.</span>
        </footer>
      </div>
    </div>
  );
}
