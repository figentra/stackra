/**
 * Stackra file contract:
 * Purpose: `Spinner`, a running spinner: its message can change, and it ends with a success or failure line.
 * Boundary: a type only. Animated on a colour terminal; one start line and one end line otherwise (FR-021).
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-018 and FR-021.
 */

/** A spinner the command controls. */
export interface Spinner {
  /** Changes the message. */
  readonly update: (message: string) => void;

  /** Stops it with a success line, or a failure line when `ok` is false. */
  readonly stop: (message?: string, ok?: boolean) => void;
}
