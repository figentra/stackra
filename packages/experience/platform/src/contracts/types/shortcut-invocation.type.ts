/**
 * Stackra file contract:
 * Purpose: `ShortcutInvocation`, one run of an App Shortcut or Siri intent the app handles: its id, the intent name
 *          the app registered, and the parameters the person or Siri filled in.
 * Boundary: a type only; plain JSON, because the OS queues it while the app is not running.
 * Runtime: isomorphic
 * Governing contract: ADR 0250 (decision 3); ADR 0478 (decision 9); STA-1539.
 */
import type { Json } from "@stackra/contracts";

/** One App Shortcut or Siri intent run. */
export interface ShortcutInvocation {
  /** The OS id of this run, unique per run. */
  readonly id: string;

  /** The registered intent name (`ReorderLast`, `ShowBooking`). */
  readonly intent: string;

  /** The parameters filled in, by name. */
  readonly params: Readonly<Record<string, Json>>;
}
