/**
 * Stackra file contract:
 * Purpose: `RuleOutcomeClass`, the class `RuleOutcome({...})` returns and a consumer extends (`class RefundWindow
 *          extends RuleOutcome({ key: "refundWindow", ... }) {}`).
 * Boundary: a type only, one construct signature, so the declaration emit of a consumer's outcome kind names an
 *           exported type (ADR 0305 rule 43). Nobody constructs one: the class is the reference `Rules.create` takes.
 * Runtime: isomorphic
 * Governing contract: ADR 0331 (decision 9); ADR 0294 (decision 25); ADR 0305 (rule 43).
 */
import type { RuleOutcome } from "#core/bases/rule-outcome.base";

/** A declared outcome kind. */
export type RuleOutcomeClass = new () => RuleOutcome;
