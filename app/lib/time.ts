export type PollingWindow = "working" | "overnight";

export const WORKING_START = 6;
export const WORKING_END = 23;

export function getPollingWindow(now: Date): PollingWindow {
  const hour = now.getHours();
  return hour >= WORKING_START && hour < WORKING_END ? "working" : "overnight";
}

export function getPollingIntervalMs(now: Date): number {
  return getPollingWindow(now) === "working" ? 15 * 60 * 1000 : 3 * 60 * 60 * 1000;
}

export function getNextRoundInterval(): number {
  const now = new Date();
  const currentMinutes = now.getMinutes();
  const currentSeconds = now.getSeconds();
  const currentMs = now.getMilliseconds();
  
  // Find next 15-minute mark (00, 15, 30, 45)
  const nextInterval = Math.ceil(currentMinutes / 15) * 15;
  const targetMinutes = nextInterval >= 60 ? 0 : nextInterval;
  const targetHour = nextInterval >= 60 ? now.getHours() + 1 : now.getHours();
  
  const nextUpdate = new Date();
  nextUpdate.setHours(targetHour, targetMinutes, 0, 0);
  
  return nextUpdate.getTime() - now.getTime();
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
