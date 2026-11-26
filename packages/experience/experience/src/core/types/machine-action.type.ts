/**
 * Stackra file contract:
 * Purpose: `MachineAction`, the action window at the top of the hero's machine: its file name and its code.
 * Boundary: a type only, the field type of `Machine`. The code is shown as text, never run and never translated.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); STA-2041.
 */

/** The action window. */
export interface MachineAction {
  /** The window's title (`cancel-order.action.ts`). */
  readonly filename: string;

  /** The action's code, shown as text. */
  readonly code: string;
}
