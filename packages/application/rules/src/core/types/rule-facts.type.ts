/**
 * Stackra file contract:
 * Purpose: `RuleFacts`, everything one evaluation may test: per fact source key, the values of its fields.
 * Boundary: a type only. The consumer computes the facts; the engine only reads them. A field the facts leave out, or
 *           give as `null`, is missing, and a missing fact matches only `is_not_set`. The current time is not a fact
 *           here: it is `EvaluateOptions.now`, which every evaluation requires.
 * Runtime: isomorphic
 * Governing contract: ADR 0331 (decisions 4 and 6); STA-1383 (package-qualified: iam owns Decision, ai owns Facts).
 */
import type { FactValue } from "#core/types/fact-value.type";

/**
 * The facts of one evaluation.
 *
 * @example
 * const facts: RuleFacts = { cart: { total: Money.of("120.00", "USD"), skus: ["sku_1"] }, customer: { tier: "gold" } };
 */
export type RuleFacts = Readonly<
  Record<string, Readonly<Record<string, FactValue | null | undefined>>>
>;
