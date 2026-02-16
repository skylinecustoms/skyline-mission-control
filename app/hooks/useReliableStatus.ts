"use client";

import { useEffect, useState, useRef } from "react";

export type StatusResponse = {
  updatedAt: string;
  haikuModel: string;
  activeAutomations: { name: string; nextRun: string }[];
  currentTasks: string[];
  completedToday: string[];
  systemHealth: { name: string; status: "ok" | "warning" | "issue" }[];
  integrationNotes: Record<string, string>;
};

export const useReliableStatus = () => {
  const [data, setData] = useState<StatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [nextUpdate, setNextUpdate] = useState<Date | null>(null);
  
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const getNextRoundTime = (): Date => {
    const now = new Date();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const ms = now.getMilliseconds();
    
    // Find next 15-minute mark (00, 15, 30, 45)
    const nextInterval = Math.ceil(minutes / 15) * 15;
    
    const nextTime = new Date();
    if (nextInterval >= 60) {
      nextTime.setHours(now.getHours() + 1, 0, 0, 0);
    } else {
      nextTime.setMinutes(nextInterval, 0, 0);
    }
    
    return nextTime;
  };

  const fetchStatus = async (): Promise<void> => {
    if (!mountedRef.current) return;
    
    console.log(`[${new Date().toLocaleTimeString()}] Fetching status...`);
    
    try {
      // Add cache buster to ensure fresh data
      const cacheBuster = Date.now();
      const response = await fetch(`/api/status?t=${cacheBuster}`, {
        cache: "no-store",
        headers: { "Accept": "application/json" }
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const payload = await response.json() as StatusResponse;
      
      if (!mountedRef.current) return;
      
      const now = new Date();
      setData(payload);
      setError(null);
      setLastUpdated(new Date(payload.updatedAt));
      
      // Calculate next round 15-minute interval
      const nextTime = getNextRoundTime();
      setNextUpdate(nextTime);
      setIsLoading(false);
      
      console.log(`[${now.toLocaleTimeString()}] Status updated successfully. Next update: ${nextTime.toLocaleTimeString()}`);
      
    } catch (err) {
      if (!mountedRef.current) return;
      
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error(`[${new Date().toLocaleTimeString()}] Status fetch failed:`, message);
      
      setError(message);
      setIsLoading(false);
      
      // Still set next update even on error
      const nextTime = getNextRoundTime();
      setNextUpdate(nextTime);
    }
  };

  const retry = () => {
    console.log(`[${new Date().toLocaleTimeString()}] Manual retry triggered`);
    void fetchStatus();
  };

  useEffect(() => {
    console.log(`[${new Date().toLocaleTimeString()}] Starting simple status polling...`);
    
    mountedRef.current = true;
    
    // Initial fetch immediately
    void fetchStatus();
    
    // Simple interval every 15 minutes - no complex timing
    intervalRef.current = setInterval(() => {
      if (mountedRef.current) {
        console.log(`[${new Date().toLocaleTimeString()}] 15-minute interval - fetching status`);
        void fetchStatus();
      }
    }, 15 * 60 * 1000); // 15 minutes = 900,000 milliseconds

    return () => {
      console.log(`[${new Date().toLocaleTimeString()}] Cleaning up status polling...`);
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  return {
    data,
    error,
    isLoading,
    lastUpdated,
    nextUpdate,
    retry
  };
};