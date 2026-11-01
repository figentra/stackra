/**
 * Stackra file contract:
 * Purpose: `TamoFieldAssistProps`, the props of the internal `TamoFieldAssist` in `tamo-field-assist.tsx`.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0507.
 */
import type { ReactNode } from "react";

import type { TamoSlot } from "#contracts/types/tamo-slot.type";

/** Props of the Tamo assist of a text field or area. */
export interface TamoFieldAssistProps {
  /** The slot, already known to be on for this field. */
  readonly slot: TamoSlot;
  /** The field's name, for the per-field setting and the task. */
  readonly field?: string | undefined;
  /** The field's text. */
  readonly value: string;
  /** Puts new text in the field. */
  readonly onChange: (next: string) => void;
  /** True for a text area: the button sits at the top end, and "Continue writing" is offered. */
  readonly isMultiline: boolean;
  /** The input or text area. */
  readonly children: ReactNode;
}
