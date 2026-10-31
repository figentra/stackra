/**
 * Stackra file contract:
 * Purpose: `SignalSource`, where the kernel hears `SIGINT` and `SIGTERM`: the process in `./node`, a manual source in
 *          `./testing`.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-012 and FR-013.
 */
import type { ConsoleSignal } from "#contracts/types/console-signal.type";

/** A source of stop signals. */
export interface SignalSource {
  /** Calls `handler` on each signal until the returned function is called. */
  readonly on: (handler: (signal: ConsoleSignal) => void) => () => void;
}
