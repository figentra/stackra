/**
 * Stackra file contract:
 * Purpose: `DecideOptions`, what `decide` takes beside the rule and the facts: the evaluation options and the legal
 *          floors in force for the market the decision is for.
 * Boundary: a type only. `floors` is required, so no caller decides without the guard; a market with no floors passes
 *           `[]`. The floors are `@stackra/market-packs`' `floorsOn(resolved, date)`, read by the caller.
 * Runtime: isomorphic
 * Governing contract: ADR 0331 (decision 6); ADR 0370 (decision 6); config-model section 4.
 */
import type { ResolvedValue } from "@stackra/market-packs";

import type { EvaluateOptions } from "#core/types/evaluate-options.type";

/** The options of `decide`. */
export interface DecideOptions extends EvaluateOptions {
  /** The legal floors in force for the decision's market and date. */
  readonly floors: readonly ResolvedValue[];
}
