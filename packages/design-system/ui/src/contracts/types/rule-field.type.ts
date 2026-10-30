/**
 * Stackra file contract:
 * Purpose: `RuleField`, one field a rule can test: its key, label, value kind and, for a choice, its options.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371.
 */
import type { RuleFieldType } from "#contracts/enums/rule-field-type.enum";
import type { SelectItem } from "#contracts/types/select-item.type";

/** A field of a rule builder. */
export interface RuleField {
  readonly key: string;
  readonly label: string;
  readonly type: RuleFieldType;
  /** The choices of a `choice` field. */
  readonly options?: readonly SelectItem[] | undefined;
}
