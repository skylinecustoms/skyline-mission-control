"use client";

import { forwardRef } from "react";
import type { KeyboardEvent } from "react";
import type { Task } from "./kanbanTypes";
import { statusStyles } from "./statusStyles";

const priorityColors: Record<Task["priority"], string> = {
  low: "border-l-mc-ice",
  medium: "border-l-mc-amber",
  high: "border-l-mc-ember",
};

const buildTaskLabel = (task: Task) => {
  const parts = [
    task.name,
    `Type ${task.type}`,
    `Priority ${task.priority}`,
  ];

  if (task.nextRun) {
    parts.push(`Next run ${task.nextRun}`);
  }

  if (task.healthStatus) {
    parts.push(`Health ${task.healthStatus}`);
  }

  return parts.join(", ");
};

type TaskCardProps = {
  task: Task;
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
};

const TaskCard = forwardRef<HTMLDivElement, TaskCardProps>(({ task, onKeyDown }, ref) => (
  <div
    ref={ref}
    role="listitem"
    tabIndex={0}
    aria-label={buildTaskLabel(task)}
    onKeyDown={onKeyDown}
    className={`glass-card rounded-2xl p-4 border-l-4 ${priorityColors[task.priority]} animate-float-in focus-visible:outline focus-visible:outline-2 focus-visible:outline-mc-ice focus-visible:outline-offset-2`}
  >
    <div className="flex items-start justify-between mb-2">
      <h4 className="text-base font-medium text-white leading-tight">{task.name}</h4>
      <div className="flex flex-col items-end gap-1">
        {task.type === "automation" && (
          <span className="text-xs px-2 py-1 rounded-full bg-mc-ice/15 text-mc-ice uppercase tracking-wider">
            Auto
          </span>
        )}
        {task.type === "system" && task.healthStatus && (
          <span className={`status-dot ${statusStyles[task.healthStatus]}`} aria-hidden="true" />
        )}
        {task.priority === "high" && (
          <span className="text-xs text-mc-ember" aria-hidden="true">🔥</span>
        )}
      </div>
    </div>
    {task.nextRun && (
      <p className="text-xs text-muted mt-2">Next: {task.nextRun}</p>
    )}
  </div>
));

TaskCard.displayName = "TaskCard";

export default TaskCard;
