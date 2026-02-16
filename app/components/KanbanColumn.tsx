"use client";

import type { KeyboardEvent } from "react";
import type { KanbanColumnConfig, Task } from "./kanbanTypes";
import TaskCard from "./TaskCard";

type KanbanColumnProps = {
  column: KanbanColumnConfig;
  tasks: Task[];
  isLoading: boolean;
  columnIndex: number;
  registerCardRef: (columnIndex: number, cardIndex: number) => (node: HTMLDivElement | null) => void;
  onCardKeyDown: (event: KeyboardEvent<HTMLDivElement>, columnIndex: number, cardIndex: number) => void;
  registerEmptyRef: (columnIndex: number) => (node: HTMLDivElement | null) => void;
  onEmptyKeyDown: (event: KeyboardEvent<HTMLDivElement>, columnIndex: number) => void;
};

const SkeletonCard = () => (
  <div
    aria-hidden="true"
    className="glass-card rounded-2xl p-4 border border-white/10 animate-pulse"
  >
    <div className="h-4 w-3/4 rounded-full bg-white/10" />
    <div className="mt-3 h-3 w-1/2 rounded-full bg-white/10" />
  </div>
);

export default function KanbanColumn({
  column,
  tasks,
  isLoading,
  columnIndex,
  registerCardRef,
  onCardKeyDown,
  registerEmptyRef,
  onEmptyKeyDown,
}: KanbanColumnProps) {
  const columnTitleId = `column-${column.id}-title`;
  const columnCountId = `column-${column.id}-count`;

  return (
    <div
      className="flex-shrink-0 w-72 min-w-72 md:w-80 md:min-w-80 flex flex-col snap-center first:ml-8 last:mr-8 md:first:ml-0 md:last:mr-0"
      role="region"
      aria-labelledby={columnTitleId}
      aria-describedby={columnCountId}
    >
      <div className={`rounded-t-3xl p-4 border-2 ${column.borderClass} ${column.bgClass}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <span className="text-2xl" aria-hidden="true">{column.icon}</span>
            <div>
              <h2
                id={columnTitleId}
                className="text-xl font-semibold uppercase tracking-[0.15em] text-white"
              >
                {column.title}
              </h2>
              <p className="text-xs uppercase tracking-[0.2em] text-muted">
                {column.subtitle}
              </p>
            </div>
          </div>
          <span
            id={columnCountId}
            className="bg-white/10 text-white/80 text-sm font-medium px-3 py-1 rounded-full min-w-[2.5rem] text-center"
            aria-label={`${tasks.length} tasks`}
          >
            {tasks.length}
          </span>
        </div>
      </div>

      <div
        className={`flex-1 rounded-b-3xl border-2 border-t-0 ${column.borderClass} ${column.bgClass} p-4 min-h-[400px] max-h-[60vh] overflow-y-auto scrollbar-hide`}
        role="list"
        aria-label={`${column.title} tasks`}
      >
        <div className="flex flex-col gap-3">
          {isLoading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : tasks.length === 0 ? (
            <div
              ref={registerEmptyRef(columnIndex)}
              tabIndex={0}
              role="note"
              aria-label={`No tasks in ${column.title}`}
              onKeyDown={(event) => onEmptyKeyDown(event, columnIndex)}
              className="flex flex-col items-center justify-center h-32 text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-mc-ice focus-visible:outline-offset-4 rounded-2xl"
            >
              <span className="text-4xl opacity-30 mb-2" aria-hidden="true">💤</span>
              <p className="text-sm text-muted">Nothing here yet</p>
            </div>
          ) : (
            tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                ref={registerCardRef(columnIndex, index)}
                onKeyDown={(event) => onCardKeyDown(event, columnIndex, index)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
