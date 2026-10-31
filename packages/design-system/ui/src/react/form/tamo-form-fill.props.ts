/**
 * Stackra file contract:
 * Purpose: `TamoFormFillProps`, the props of the internal `TamoFormFill` in `tamo-form-fill.tsx`.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0507.
 */
import type { FieldValues } from "react-hook-form";

import type { TamoFieldHint } from "#contracts/types/tamo-field-hint.type";
import type { TamoSlot } from "#contracts/types/tamo-slot.type";
import type { SchemaFormHandle } from "#form/types/schema-form-handle.type";

/** Props of a form's fill-from-text bar. */
export interface TamoFormFillProps<T extends FieldValues = FieldValues> {
  readonly slot: TamoSlot;
  readonly form: SchemaFormHandle<T>;
  /** The fields Tamo may fill; left out, the form's plain text inputs and areas, named by their labels. */
  readonly fields?: readonly TamoFieldHint[] | undefined;
  /** Called with the names Tamo filled, or an empty list once the person kept or undid them. */
  readonly onReview: (names: readonly string[]) => void;
  /** The names awaiting the person's check. */
  readonly pending: readonly string[];
}
