/**
 * Stackra file contract:
 * Purpose: `HapticEntry`, one touch feedback an entry plays: the event and the style.
 * Boundary: a type only, in its own file.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 8; ADR 0305 (one declaration per file).
 */
import type { HapticStyle } from "#src/enums/haptic-style.enum";

/** One haptic an entry plays on native. */
export interface HapticEntry {
  /** The event, for example "press" or "select". */
  readonly event: string;
  /** The feedback style. */
  readonly style: HapticStyle;
}
