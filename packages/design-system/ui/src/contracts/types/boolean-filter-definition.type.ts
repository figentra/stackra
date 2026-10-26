/**
 * Stackra file contract:
 * Purpose: `BooleanFilterDefinition`: a filter on a yes or no flag.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          7); ADR 0318.
 */
import type { FilterDefinitionBase } from "#contracts/types/filter-definition-base.type";

/** A filter on a yes or no flag. */
export interface BooleanFilterDefinition extends FilterDefinitionBase<"boolean"> {
  /** The text of the yes choice and of the chip when it is picked. Defaults to the `ui` catalogue's word in the active locale. */
  readonly trueLabel?: string | undefined;
  /** The text of the no choice and of the chip when it is picked. Defaults to the `ui` catalogue's word in the active locale. */
  readonly falseLabel?: string | undefined;
}
