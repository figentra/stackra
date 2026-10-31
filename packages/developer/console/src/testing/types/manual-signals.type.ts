/**
 * Stackra file contract:
 * Purpose: `ManualSignals`, a signal source a test fires by hand.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-012 and FR-027.
 */
import type { ConsoleSignal } from "#contracts/types/console-signal.type";
import type { SignalSource } from "#contracts/types/signal-source.type";

/** A signal source with a trigger. */
export interface ManualSignals extends SignalSource {
  /** Sends `signal` to every listener. */
  readonly send: (signal: ConsoleSignal) => void;
}
