/**
 * Stackra file contract:
 * Purpose: `BumpedPins`, what `bumpStackraPins` answers for one file: its text after the bump and every pin found.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2); STA-145.
 */
import type { PinChange } from "#node/upgrade/types/pin-change.type";

/** What one file pins, and its text after the bump. */
export type BumpedPins = {
  /** The text with the pins moved; the input when no target was given. */
  readonly text: string;

  /** Every pin found, with the version it moved to (equal to `from` when it did not move). */
  readonly pins: readonly PinChange[];
};
