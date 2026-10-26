/**
 * Stackra file contract:
 * Purpose: `NumberFilterDefinition`: a filter on a number range.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          7); ADR 0318.
 */
import type { NumberFieldContractProps } from "#contracts/types/number-field-contract-props.type";
import type { FilterDefinitionBase } from "#contracts/types/filter-definition-base.type";

/** A filter on a number range; the bounds, step and format are NumberField's. */
export interface NumberFilterDefinition
  extends
    FilterDefinitionBase<"number">,
    Pick<NumberFieldContractProps, "minValue" | "maxValue" | "step" | "formatOptions"> {}
