/**
 * Stackra file contract:
 * Purpose: `MachineAction`, the action window at the top of the hero's machine: its file name and its code.
 * Boundary: a shape class only, the field type of `Machine`; gen compiles it with the hero block. The code is shown
 *           as text, never run and never translated.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26); ADR 0305 (one declaration per file); STA-2041.
 */
import { Schema } from "@stackra/validation";

/** The action window. */
export class MachineAction extends Schema {
  /** The window's title (`cancel-order.action.ts`). */
  filename!: string;

  code!: string;
}
