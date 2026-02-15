import { NextResponse } from "next/server";

export function GET() {
  const now = new Date();

  return NextResponse.json({
    updatedAt: now.toISOString(),
    haikuModel: "gpt-4o-mini (Haiku)",
    activeAutomations: [
      { name: "Daily Morning Brief", nextRun: "7:00 AM" },
      { name: "System Optimizer", nextRun: "8:00 PM" },
      { name: "P&L Reports", nextRun: "Mon 8:30 AM" },
      { name: "Sales Brief", nextRun: "Coming Soon" }
    ],
    currentTasks: [
      "Building Mission Control app (Codex)",
      "Reddit intelligence analysis",
      "API integrations in progress"
    ],
    completedToday: [
      "Updated morning brief format",
      "Optimized heartbeat to Haiku",
      "Installed Codex agent",
      "Created GitHub backups"
    ],
    systemHealth: [
      { name: "QuickBooks token expires in 3 days", status: "warning" },
      { name: "Meta API", status: "ok" },
      { name: "GHL", status: "ok" }
    ],
    integrationNotes: {
      cronApi: "OpenClaw cron API",
      backgroundMonitor: "Background process telemetry",
      systemLogs: "Completion timestamps from logs",
      healthEndpoints: "Live health endpoints"
    }
  });
}
