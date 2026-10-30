/**
 * Stackra file contract:
 * Purpose: `KnobSpec`, one control of the knobs playground, read from a generated API prop: the prop, its control and,
 *          for a select, its options.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); STA-1371 (doc pages wave, 2026-10-28).
 */
import type { Knob } from "@stackra/showcase";

/** A knob with what its control needs. */
export interface KnobSpec extends Knob {
  /** The choices of a select, in the API's order. */
  readonly options?: readonly string[];
  /** The API default, unquoted ("primary"), if any. */
  readonly initial?: string;
}
