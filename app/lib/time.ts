export type PollingWindow = "working" | "overnight";

export const WORKING_START = 6;
export const WORKING_END = 23;

export function getPollingWindow(now: Date): PollingWindow {
  const hour = now.getHours();
  return hour >= WORKING_START && hour < WORKING_END ? "working" : "overnight";
}

export function getPollingIntervalMs(now: Date): number {
  return getPollingWindow(now) === "working" ? 5 * 60 * 1000 : 3 * 60 * 60 * 1000;
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
