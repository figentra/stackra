/**
 * Stackra file contract:
 * Purpose: `TamoFieldAssistProps`, the props of the native `TamoFieldAssist` in `tamo-field-assist.tsx`.
 * Boundary: types only; internal to the native TextField and TextArea, not exported from the entry.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0507.
 */
import type { ReactNode } from "react";

import type { TamoSlot } from "#contracts/types/tamo-slot.type";

/** Props of the native TamoFieldAssist. */
export interface TamoFieldAssistProps {
  /** The slot `useTamo` returned for the field. */
  readonly slot: TamoSlot;
  /** The field's key, sent with each task. */
  readonly field: string | undefined;
  /** The field's text now. */
  readonly text: string;
  /** Puts accepted text in the field. */
  readonly onAccept: (text: string) => void;
  /** True to show the Tamo button (the field has had focus: a touch screen has no hover). */
  readonly isShown: boolean;
  /** True to offer "Continue writing" (a text area). */
  readonly hasContinue?: boolean | undefined;
  /** The field's input, which the Tamo button sits beside. */
  readonly children: ReactNode;
}
