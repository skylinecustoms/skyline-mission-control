"use client";

import { useEffect, useMemo, useState } from "react";
import { formatTime, getPollingIntervalMs, getPollingWindow } from "../lib/time";

type Task = {
  id: string;
  name: string;
  status: "backlog" | "active" | "review" | "complete";
  type: "automation" | "task" | "system";
  priority: "low" | "medium" | "high";
  nextRun?: string;
  healthStatus?: "ok" | "warning" | "issue";
};

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

const priorityColors: Record<"low" | "medium" | "high", string> = {
  low: "border-l-mc-ice",
  medium: "border-l-mc-amber", 
  high: "border-l-mc-ember",
};

const columnConfig = [
  {
    id: "backlog" as const,
    title: "Scheduled",
    subtitle: "Upcoming",
    icon: "📋",
    bgClass: "bg-slate-500/10",
    borderClass: "border-slate-500/20",
  },
  {
    id: "active" as const,
    title: "Running",
    subtitle: "Live Now",
    icon: "⚡",
    bgClass: "bg-mc-ice/10",
    borderClass: "border-mc-ice/20",
  },
  {
    id: "review" as const,
    title: "Monitoring",
    subtitle: "Health Check",
    icon: "🔍",
    bgClass: "bg-mc-amber/10",
    borderClass: "border-mc-amber/20",
  },
  {
    id: "complete" as const,
    title: "Complete",
    subtitle: "Success",
    icon: "✅",
    bgClass: "bg-mc-emerald/10",
    borderClass: "border-mc-emerald/20",
  },
];

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

  // Transform API data into kanban tasks
  const tasks = useMemo(() => {
    if (!data) return [];
    
    const transformedTasks: Task[] = [];
    
    // Active automations go to "backlog" (scheduled)
    data.activeAutomations?.forEach((automation, index) => {
      transformedTasks.push({
        id: `automation-${index}`,
        name: automation.name,
        status: "backlog",
        type: "automation",
        priority: "medium",
        nextRun: automation.nextRun,
      });
    });

    // Current tasks go to "active" 
    data.currentTasks?.forEach((task, index) => {
      transformedTasks.push({
        id: `task-${index}`,
        name: task,
        status: "active",
        type: "task",
        priority: "high",
      });
    });

    // System health items go to "review"
    data.systemHealth?.forEach((health, index) => {
      transformedTasks.push({
        id: `health-${index}`,
        name: health.name,
        status: "review",
        type: "system",
        priority: health.status === "issue" ? "high" : health.status === "warning" ? "medium" : "low",
        healthStatus: health.status,
      });
    });

    // Completed tasks go to "complete"
    data.completedToday?.forEach((task, index) => {
      transformedTasks.push({
        id: `completed-${index}`,
        name: task,
        status: "complete",
        type: "task",
        priority: "low",
      });
    });

    return transformedTasks;
  }, [data]);

  const getTasksByStatus = (status: Task["status"]) => {
    return tasks.filter((task) => task.status === status);
  };

  const TaskCard = ({ task }: { task: Task }) => (
    <div className={`glass-card rounded-2xl p-4 border-l-4 ${priorityColors[task.priority]} animate-float-in`}>
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-base font-medium text-white leading-tight">{task.name}</h4>
        <div className="flex flex-col items-end gap-1">
          {task.type === "automation" && (
            <span className="text-xs px-2 py-1 rounded-full bg-mc-ice/15 text-mc-ice uppercase tracking-wider">
              Auto
            </span>
          )}
          {task.type === "system" && task.healthStatus && (
            <span className={`status-dot ${statusStyles[task.healthStatus]}`} />
          )}
          {task.priority === "high" && (
            <span className="text-xs text-mc-ember">🔥</span>
          )}
        </div>
      </div>
      {task.nextRun && (
        <p className="text-xs text-muted mt-2">Next: {task.nextRun}</p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-grid">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-16 pt-6 md:px-8">
        {/* Header */}
        <header className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-muted">
                Skyline Customs
              </p>
              <h1 className="text-4xl font-semibold uppercase tracking-[0.08em] text-white md:text-5xl">
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
          <div className="glass-card rounded-2xl px-4 py-3 text-sm text-white/80 shadow-soft-glow md:px-6">
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

        {/* Kanban Board */}
        <section className="flex-1">
          <div className="flex flex-col gap-4 md:flex-row md:gap-6 md:overflow-x-auto">
            {columnConfig.map((column) => {
              const columnTasks = getTasksByStatus(column.id);
              return (
                <div
                  key={column.id}
                  className="flex-shrink-0 w-full md:w-80 flex flex-col"
                >
                  {/* Column Header */}
                  <div className={`rounded-t-3xl p-4 border-2 ${column.borderClass} ${column.bgClass}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{column.icon}</span>
                        <div>
                          <h2 className="text-xl font-semibold uppercase tracking-[0.15em] text-white">
                            {column.title}
                          </h2>
                          <p className="text-xs uppercase tracking-[0.2em] text-muted">
                            {column.subtitle}
                          </p>
                        </div>
                      </div>
                      <span className="bg-white/10 text-white/80 text-sm font-medium px-3 py-1 rounded-full min-w-[2.5rem] text-center">
                        {columnTasks.length}
                      </span>
                    </div>
                  </div>

                  {/* Column Body */}
                  <div className={`flex-1 rounded-b-3xl border-2 border-t-0 ${column.borderClass} ${column.bgClass} p-4 min-h-[300px]`}>
                    <div className="flex flex-col gap-3">
                      {columnTasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-center">
                          <span className="text-4xl opacity-30 mb-2">💤</span>
                          <p className="text-sm text-muted">Nothing here yet</p>
                        </div>
                      ) : (
                        columnTasks.map((task) => (
                          <TaskCard key={task.id} task={task} />
                        ))
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Live Integrations Footer */}
        {data?.integrationNotes && Object.keys(data.integrationNotes).length > 0 && (
          <section className="glass-card rounded-3xl p-4 md:p-6 text-sm text-white/80">
            <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <h2 className="text-lg font-semibold uppercase tracking-[0.15em] text-white">
                Live Integrations
              </h2>
              <span className="text-xs uppercase tracking-[0.28em] text-muted">
                Real-time data feeds
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 text-base md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(data.integrationNotes).map(([key, value]) => (
                <div key={key} className="rounded-xl border border-white/10 bg-black/30 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted">
                    {key.replace(/([A-Z])/g, " $1")}
                  </p>
                  <p className="text-sm text-white/90 mt-1">{value}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <footer className="flex flex-col items-start gap-2 text-xs text-muted md:flex-row md:items-center md:justify-between">
          <span>Kanban-style mission control • Mobile-optimized for iPhone</span>
          <span>Automation updates routed through Haiku for cost efficiency</span>
        </footer>
      </div>
    </div>
  );
}
