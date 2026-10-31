/**
 * Stackra file contract:
 * Purpose: `useTamoTask()`, the one working, stop, retry and error state every Tamo part shares: it runs a task with
 *          an abort signal, keeps its result, stops it (back to idle) and runs the last task again.
 * Boundary: state only; the task is the caller's (`slot.run(...)`). A newer run aborts the older one, and a stopped or
 *           superseded run never writes its result.
 * Runtime: isomorphic
 * Governing contract: ADR 0507 (the shared state set); ADR 0021 (a result is a proposal, never applied here).
 */
import { useCallback, useEffect, useRef, useState } from "react";

import type { TamoStatus } from "#contracts/enums/tamo-status.enum";

/** What `useTamoTask` hands back. */
interface TamoTask<T> {
  readonly status: TamoStatus;
  /** The last result, while `ready`. */
  readonly result: T | undefined;
  /** What the last run threw, while `error`. */
  readonly error: unknown;
  /** Runs `job`, aborting any run before it. */
  readonly run: (job: (signal: AbortSignal) => Promise<T>) => void;
  /** Aborts the running job; back to idle. */
  readonly stop: () => void;
  /** Runs the last job again. */
  readonly retry: () => void;
  /** Drops the result or error; back to idle. */
  readonly reset: () => void;
}

/** The state of one Tamo task. */
export function useTamoTask<T>(): TamoTask<T> {
  const [state, setState] = useState<{ status: TamoStatus; result?: T; error?: unknown }>({
    status: "idle",
  });
  const controller = useRef<AbortController | null>(null);
  const last = useRef<((signal: AbortSignal) => Promise<T>) | null>(null);

  const run = useCallback((job: (signal: AbortSignal) => Promise<T>) => {
    controller.current?.abort();
    const own = new AbortController();
    controller.current = own;
    last.current = job;
    setState({ status: "working" });
    job(own.signal).then(
      (result) => {
        if (controller.current === own && !own.signal.aborted)
          setState({ status: "ready", result });
      },
      (error: unknown) => {
        if (controller.current === own && !own.signal.aborted) setState({ status: "error", error });
      },
    );
  }, []);
  const stop = useCallback(() => {
    controller.current?.abort();
    controller.current = null;
    setState({ status: "idle" });
  }, []);
  const retry = useCallback(() => {
    if (last.current) run(last.current);
  }, [run]);
  const reset = useCallback(() => {
    controller.current?.abort();
    controller.current = null;
    setState({ status: "idle" });
  }, []);
  useEffect(() => () => controller.current?.abort(), []);

  return {
    status: state.status,
    result: state.result,
    error: state.error,
    run,
    stop,
    retry,
    reset,
  };
}
