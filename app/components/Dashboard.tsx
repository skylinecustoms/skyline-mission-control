"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import type { KeyboardEvent } from "react";
import { formatTime } from "../lib/time";
import { useSimpleStatus } from "../hooks/useSimpleStatus";
import KanbanColumn from "./KanbanColumn";
import type { KanbanColumnConfig, Task } from "./kanbanTypes";
import { statusStyles } from "./statusStyles";

const columnConfig: KanbanColumnConfig[] = [
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
    id: "complete" as const,
    title: "Complete",
    subtitle: "Success",
    icon: "✅",
    bgClass: "bg-mc-emerald/10",
    borderClass: "border-mc-emerald/20",
  },
];

export default function Dashboard() {
  const { data, error, isLoading, lastUpdated, nextUpdate, retry } = useSimpleStatus();

  const heartbeatLabel = useMemo(() => {
    const now = new Date();
    const hour = now.getHours();
    const isWorking = hour >= 6 && hour < 23;
    
    return isWorking
      ? "Sync every 15 minutes (00, 15, 30, 45)"
      : "Overnight mode - reduced frequency";
  }, []);

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

    // System health items will be handled separately in monitoring section

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

  const tasksByColumn = useMemo(
    () => columnConfig.map((column) => tasks.filter((task) => task.status === column.id)),
    [tasks]
  );

  const cardRefs = useRef<Array<Array<HTMLDivElement | null>>>([]);
  const emptyRefs = useRef<Array<HTMLDivElement | null>>([]);
  const didInitialFocus = useRef(false);

  const registerCardRef = useCallback(
    (columnIndex: number, cardIndex: number) => (node: HTMLDivElement | null) => {
      if (!cardRefs.current[columnIndex]) {
        cardRefs.current[columnIndex] = [];
      }
      cardRefs.current[columnIndex][cardIndex] = node;
    },
    []
  );

  const registerEmptyRef = useCallback(
    (columnIndex: number) => (node: HTMLDivElement | null) => {
      emptyRefs.current[columnIndex] = node;
    },
    []
  );

  const focusCard = useCallback((columnIndex: number, cardIndex: number) => {
    const node = cardRefs.current[columnIndex]?.[cardIndex];
    if (node) {
      node.focus();
      return true;
    }
    return false;
  }, []);

  const focusEmpty = useCallback((columnIndex: number) => {
    const node = emptyRefs.current[columnIndex];
    if (node) {
      node.focus();
      return true;
    }
    return false;
  }, []);

  const focusFirstInColumn = useCallback(
    (columnIndex: number) => {
      if (columnIndex < 0 || columnIndex >= columnConfig.length) return false;
      if (focusCard(columnIndex, 0)) return true;
      return focusEmpty(columnIndex);
    },
    [focusCard, focusEmpty]
  );

  const focusFirstAvailable = useCallback(() => {
    for (let index = 0; index < columnConfig.length; index += 1) {
      if (focusFirstInColumn(index)) return true;
    }
    return false;
  }, [focusFirstInColumn]);

  const onCardKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>, columnIndex: number, cardIndex: number) => {
      const columnTasks = tasksByColumn[columnIndex] ?? [];
      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          focusCard(columnIndex, cardIndex + 1);
          break;
        case "ArrowUp":
          event.preventDefault();
          focusCard(columnIndex, cardIndex - 1);
          break;
        case "ArrowRight":
          event.preventDefault();
          focusFirstInColumn(columnIndex + 1);
          break;
        case "ArrowLeft":
          event.preventDefault();
          focusFirstInColumn(columnIndex - 1);
          break;
        case "Home":
          event.preventDefault();
          focusCard(columnIndex, 0);
          break;
        case "End":
          event.preventDefault();
          focusCard(columnIndex, Math.max(columnTasks.length - 1, 0));
          break;
        default:
          break;
      }
    },
    [focusCard, focusFirstInColumn, tasksByColumn]
  );

  const onEmptyKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>, columnIndex: number) => {
      switch (event.key) {
        case "ArrowRight":
          event.preventDefault();
          focusFirstInColumn(columnIndex + 1);
          break;
        case "ArrowLeft":
          event.preventDefault();
          focusFirstInColumn(columnIndex - 1);
          break;
        case "Home":
          event.preventDefault();
          focusFirstInColumn(0);
          break;
        case "End":
          event.preventDefault();
          focusFirstInColumn(columnConfig.length - 1);
          break;
        default:
          break;
      }
    },
    [focusFirstInColumn]
  );

  useEffect(() => {
    if (isLoading || didInitialFocus.current) return;
    if (document.activeElement && document.activeElement !== document.body) return;
    if (focusFirstAvailable()) {
      didInitialFocus.current = true;
    }
  }, [focusFirstAvailable, isLoading, tasksByColumn]);

  return (
    <main className="min-h-screen bg-grid" role="main">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-16 pt-6 md:px-8">
        {/* Header */}
        <header className="flex flex-col gap-4" aria-label="Mission Control header">
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
          {error && (
            <div
              className="glass-card rounded-2xl px-4 py-3 text-sm text-white/80 shadow-soft-glow md:px-6"
              role="alert"
              aria-live="assertive"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <span className="text-xs uppercase tracking-[0.2em] text-muted">
                    Sync Issue
                  </span>
                  <p className="text-sm text-white/90">{error}</p>
                </div>
                <button
                  type="button"
                  onClick={retry}
                  aria-label="Retry status sync"
                  className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/90 hover:border-white/40"
                >
                  Retry Now
                </button>
              </div>
            </div>
          )}
          <div
            className="glass-card rounded-2xl px-4 py-3 text-sm text-white/80 shadow-soft-glow md:px-6"
            role="status"
            aria-live="polite"
          >
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
                  {lastUpdated ? formatTime(lastUpdated) : isLoading ? "Connecting" : "Idle"}
                </span>
                <span className="text-xs text-muted">
                  Next update {nextUpdate ? formatTime(nextUpdate) : "calculating"}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Kanban Board */}
        <section
          className="flex-1 overflow-hidden"
          role="region"
          aria-label="Automation workflow board"
          aria-busy={isLoading}
        >
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide touch-scroll px-4 -mx-4 md:px-0 md:mx-0">
            {columnConfig.map((column, columnIndex) => (
              <KanbanColumn
                key={column.id}
                column={column}
                tasks={tasksByColumn[columnIndex] ?? []}
                isLoading={isLoading}
                columnIndex={columnIndex}
                registerCardRef={registerCardRef}
                registerEmptyRef={registerEmptyRef}
                onCardKeyDown={onCardKeyDown}
                onEmptyKeyDown={onEmptyKeyDown}
              />
            ))}
          </div>
        </section>

        {/* System Monitoring */}
        {data?.systemHealth && data.systemHealth.length > 0 && (
          <section
            className="glass-card rounded-3xl p-4 md:p-6"
            role="region"
            aria-label="System monitoring"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl" aria-hidden="true">🔍</span>
                <div>
                  <h2 className="text-xl font-semibold uppercase tracking-[0.15em] text-white">
                    System Monitoring
                  </h2>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted">
                    Health Check Status
                  </p>
                </div>
              </div>
              <span className="bg-mc-amber/15 text-mc-amber text-sm font-medium px-3 py-1 rounded-full">
                {data.systemHealth.length}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2" role="list">
              {data.systemHealth.map((item, index) => (
                <div
                  key={`health-${index}`}
                  role="listitem"
                  aria-label={`${item.name} status ${item.status}`}
                  className={`glass-card rounded-2xl p-4 border-l-4 ${
                    item.status === "issue" ? "border-l-mc-ember" : 
                    item.status === "warning" ? "border-l-mc-amber" : 
                    "border-l-mc-emerald"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`status-dot ${statusStyles[item.status]}`} aria-hidden="true" />
                      <span className="text-base font-medium text-white">{item.name}</span>
                    </div>
                    <span className="text-lg" aria-hidden="true">
                      {item.status === "issue" ? "🔥" : item.status === "warning" ? "⚠️" : "✅"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Live Integrations */}
        {data?.integrationNotes && Object.keys(data.integrationNotes).length > 0 && (
          <section
            className="glass-card rounded-3xl p-4 md:p-6 text-sm text-white/80"
            role="region"
            aria-label="Live integrations"
          >
            <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <h2 className="text-lg font-semibold uppercase tracking-[0.15em] text-white">
                Live Integrations
              </h2>
              <span className="text-xs uppercase tracking-[0.28em] text-muted">
                Real-time data feeds
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 text-base md:grid-cols-2 lg:grid-cols-3" role="list">
              {Object.entries(data.integrationNotes).map(([key, value]) => (
                <div key={key} className="rounded-xl border border-white/10 bg-black/30 p-3" role="listitem">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted">
                    {key.replace(/([A-Z])/g, " $1")}
                  </p>
                  <p className="text-sm text-white/90 mt-1">{value}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <footer
          className="flex flex-col items-start gap-2 text-xs text-muted md:flex-row md:items-center md:justify-between"
          aria-label="Usage hints"
        >
          <span>Swipe left/right: Scheduled → Running → Complete • Touch-optimized</span>
          <span>Automation updates routed through Haiku for cost efficiency</span>
        </footer>
      </div>
    </main>
  );
}
