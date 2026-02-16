"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getPollingIntervalMs, getPollingWindow } from "../lib/time";

export type StatusResponse = {
  updatedAt: string;
  haikuModel: string;
  activeAutomations: { name: string; nextRun: string }[];
  currentTasks: string[];
  completedToday: string[];
  systemHealth: { name: string; status: "ok" | "warning" | "issue" }[];
  integrationNotes: Record<string, string>;
};

export type UseStatusResult = {
  data: StatusResponse | null;
  error: string | null;
  isLoading: boolean;
  isRefreshing: boolean;
  lastUpdated: Date | null;
  nextUpdate: Date | null;
  windowLabel: "working" | "overnight";
  retry: () => void;
};

type UseStatusOptions = {
  maxRetries?: number;
  retryDelayMs?: number;
  fetchUrl?: string;
};

const DEFAULT_RETRY_DELAY_MS = 1500;
const DEFAULT_MAX_RETRIES = 3;

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Unexpected error while loading status.";
};

export const useStatus = (options: UseStatusOptions = {}): UseStatusResult => {
  const { maxRetries = DEFAULT_MAX_RETRIES, retryDelayMs = DEFAULT_RETRY_DELAY_MS, fetchUrl = "/api/status" } = options;

  const [data, setData] = useState<StatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [nextUpdate, setNextUpdate] = useState<Date | null>(null);
  const [windowLabel, setWindowLabel] = useState<"working" | "overnight">(
    getPollingWindow(new Date())
  );

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const retryCountRef = useRef(0);
  const isMountedRef = useRef(true);
  const fetchStatusRef = useRef<((args: { isManualRetry: boolean }) => void) | null>(null);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  const abortActiveRequest = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  const scheduleNextPoll = useCallback((now: Date) => {
    const intervalMs = getPollingIntervalMs(now);
    setNextUpdate(new Date(now.getTime() + intervalMs));
    timeoutRef.current = setTimeout(() => {
      fetchStatusRef.current?.({ isManualRetry: false });
    }, intervalMs);
  }, []);

  const fetchStatus = useCallback(
    async ({ isManualRetry }: { isManualRetry: boolean }) => {
      if (!isMountedRef.current) return;

      clearTimers();
      abortActiveRequest();

      const controller = new AbortController();
      abortRef.current = controller;

      setWindowLabel(getPollingWindow(new Date()));

      if (data) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const response = await fetch(fetchUrl, {
          cache: "no-store",
          signal: controller.signal,
          headers: {
            "Accept": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Status fetch failed (${response.status}).`);
        }

        const payload = (await response.json()) as StatusResponse;
        if (!isMountedRef.current) return;

        setData(payload);
        setError(null);
        retryCountRef.current = 0;

        const updated = new Date(payload.updatedAt);
        const now = new Date();
        setLastUpdated(updated);
        setWindowLabel(getPollingWindow(now));
        scheduleNextPoll(now);
      } catch (err) {
        if (!isMountedRef.current) return;
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }

        const message = getErrorMessage(err);
        setError(message);

        if (retryCountRef.current < maxRetries) {
          retryCountRef.current += 1;
          const backoff = retryDelayMs * Math.pow(2, retryCountRef.current - 1);
          retryTimeoutRef.current = setTimeout(() => {
            void fetchStatus({ isManualRetry: isManualRetry });
          }, backoff);
        } else {
          const now = new Date();
          scheduleNextPoll(now);
        }
      } finally {
        if (!isMountedRef.current) return;
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [abortActiveRequest, clearTimers, data, fetchUrl, maxRetries, retryDelayMs, scheduleNextPoll]
  );

  const retry = useCallback(() => {
    retryCountRef.current = 0;
    void fetchStatus({ isManualRetry: true });
  }, [fetchStatus]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchStatusRef.current = fetchStatus;
    void fetchStatus({ isManualRetry: false });

    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearTimers();
        abortActiveRequest();
      } else {
        void fetchStatus({ isManualRetry: false });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMountedRef.current = false;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearTimers();
      abortActiveRequest();
    };
  }, [abortActiveRequest, clearTimers, fetchStatus]);

  useEffect(() => {
    fetchStatusRef.current = fetchStatus;
  }, [fetchStatus]);

  return useMemo(
    () => ({
      data,
      error,
      isLoading,
      isRefreshing,
      lastUpdated,
      nextUpdate,
      windowLabel,
      retry,
    }),
    [data, error, isLoading, isRefreshing, lastUpdated, nextUpdate, retry, windowLabel]
  );
};
