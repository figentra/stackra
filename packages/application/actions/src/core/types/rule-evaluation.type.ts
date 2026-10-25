/**
 * Stackra file contract:
 * Purpose: `RuleEvaluation`, what a `RuleEvaluator` answers for an offline-computed document: the rule version the
 *          client used, the client's answer and the server's answer on its current data.
 * Boundary: a type only. The answers are JSON (a priced total, a tax breakdown) and compare by value, key order
 *           ignored; the pipeline records both on a review item when they differ.
 * Runtime: isomorphic
 * Governing contract: ADR 0337 (decision 4: the server re-evaluates and wins).
 */
import type { Json } from "@stackra/contracts";

/** Both answers to one document. */
export interface RuleEvaluation {
  /** The rule package version the document names (`"2.4.0"`). */
  readonly ruleVersion: string;

  /** The answer the client computed offline. */
  readonly client: Json;

  /** The answer the same rule gives on the server's current data. */
  readonly server: Json;
}
