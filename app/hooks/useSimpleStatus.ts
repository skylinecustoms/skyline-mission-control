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

export const useSimpleStatus = () => {
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
    const nextInterval = Math.ceil(minutes / 15) * 15;
    
    const next = new Date();
    if (nextInterval >= 60) {
      next.setHours(now.getHours() + 1, 0, 0, 0);
    } else {
      next.setMinutes(nextInterval, 0, 0);
    }
    
    return next;
  };

  const fetchStatus = async (): Promise<void> => {
    if (!mountedRef.current) return;
    
    try {
      const response = await fetch("/api/status", {
        cache: "no-store",
        headers: { "Accept": "application/json" }
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const payload = await response.json() as StatusResponse;
      
      if (!mountedRef.current) return;
      
      setData(payload);
      setError(null);
      setLastUpdated(new Date(payload.updatedAt));
      setNextUpdate(getNextRoundTime());
      setIsLoading(false);
      
    } catch (err) {
      if (!mountedRef.current) return;
      
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      setIsLoading(false);
      
      // Still set next update even on error
      setNextUpdate(getNextRoundTime());
    }
  };

  const startPolling = () => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Initial fetch
    void fetchStatus();

    // Calculate milliseconds until next round 15-minute mark
    const now = new Date();
    const nextRound = getNextRoundTime();
    const msUntilNext = nextRound.getTime() - now.getTime();

    // Set timeout to sync with round intervals
    setTimeout(() => {
      if (!mountedRef.current) return;
      
      // Fetch immediately when we hit the round interval
      void fetchStatus();
      
      // Then start regular 15-minute intervals
      intervalRef.current = setInterval(() => {
        if (mountedRef.current) {
          void fetchStatus();
        }
      }, 15 * 60 * 1000); // 15 minutes
      
    }, msUntilNext);
  };

  const retry = () => {
    void fetchStatus();
  };

  useEffect(() => {
    mountedRef.current = true;
    startPolling();

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []); // Empty dependency array - run once on mount

  return {
    data,
    error,
    isLoading,
    lastUpdated,
    nextUpdate,
    retry
  };
};