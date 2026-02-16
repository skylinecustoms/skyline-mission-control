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
      
      // Calculate next update time (15 minutes from now)
      const nextTime = new Date(now.getTime() + (15 * 60 * 1000));
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
      const now = new Date();
      const nextTime = new Date(now.getTime() + (15 * 60 * 1000));
      setNextUpdate(nextTime);
    }
  };

  const retry = () => {
    console.log(`[${new Date().toLocaleTimeString()}] Manual retry triggered`);
    void fetchStatus();
  };

  useEffect(() => {
    console.log(`[${new Date().toLocaleTimeString()}] Starting reliable status polling...`);
    
    mountedRef.current = true;
    
    // Initial fetch immediately
    void fetchStatus();
    
    // Set up interval for every 15 minutes (900,000 ms)
    intervalRef.current = setInterval(() => {
      if (mountedRef.current) {
        void fetchStatus();
      } else {
        console.log('Component unmounted, skipping fetch');
      }
    }, 15 * 60 * 1000);
    
    console.log(`[${new Date().toLocaleTimeString()}] Polling interval set for every 15 minutes`);

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