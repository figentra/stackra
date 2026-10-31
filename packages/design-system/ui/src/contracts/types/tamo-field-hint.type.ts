/**
 * Stackra file contract:
 * Purpose: `TamoFieldHint`, what Tamo is told about a column or a form field it may fill or filter on: key, label, kind and
 *          choices.
 * Boundary: a type only; never a value of the record, so a hint is safe to send (ADR 0490 decision 6).
 * Runtime: isomorphic
 * Governing contract: ADR 0507 (Ask Tamo: AI slots in the design system).
 */
import type { RuleFieldType } from "#contracts/enums/rule-field-type.enum";

/** One column or field, as Tamo is told about it. */
export interface TamoFieldHint {
  /** The column id or the field name. */
  readonly id: string;
  /** Its label in the active language. */
  readonly label: string;
  /** Its kind; `text` when left out. */
  readonly type?: RuleFieldType | undefined;
  /** The choices of a `choice` field, by value. */
  readonly options?: readonly string[] | undefined;
}
