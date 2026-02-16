export type TaskStatus = "backlog" | "active" | "complete";
export type TaskType = "automation" | "task" | "system";
export type TaskPriority = "low" | "medium" | "high";

export type Task = {
  id: string;
  name: string;
  status: TaskStatus;
  type: TaskType;
  priority: TaskPriority;
  nextRun?: string;
  healthStatus?: "ok" | "warning" | "issue";
};

export type KanbanColumnConfig = {
  id: TaskStatus;
  title: string;
  subtitle: string;
  icon: string;
  bgClass: string;
  borderClass: string;
};
