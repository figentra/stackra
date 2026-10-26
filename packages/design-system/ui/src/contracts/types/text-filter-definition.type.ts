/**
 * Stackra file contract:
 * Purpose: `TextFilterDefinition`: a filter on text the records contain.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          7); ADR 0318.
 */
import type { FilterDefinitionBase } from "#contracts/types/filter-definition-base.type";

/** A filter on text the records contain. */
export interface TextFilterDefinition extends FilterDefinitionBase<"text"> {
  /** Hint text drawn inside the empty editor. */
  readonly placeholder?: string | undefined;
}
