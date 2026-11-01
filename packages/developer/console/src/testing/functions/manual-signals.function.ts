/**
 * Stackra file contract:
 * Purpose: `manualSignals()`, a signal source a test fires with `send("SIGINT")`.
 * Boundary: no process listener.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-012 and FR-027.
 */
import type { ConsoleSignal } from "#contracts/types/console-signal.type";
import type { ManualSignals } from "#testing/types/manual-signals.type";

/** A new manual signal source. */
export function manualSignals(): ManualSignals {
  const handlers = new Set<(signal: ConsoleSignal) => void>();
  return {
    on: (handler) => {
      handlers.add(handler);
      return () => handlers.delete(handler);
    },
    send: (signal) => {
      for (const handler of handlers) handler(signal);
    },
  };
}
