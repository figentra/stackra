/**
 * Stackra file contract:
 * Purpose: `ActionAccepts`, an action's `accepts` option: it takes documents a client computed with rule code (a priced
 *          sale, a return), names the oldest rule version it accepts without review and the evaluator that re-runs the
 *          rule on the server.
 * Boundary: a type only. The pipeline runs the evaluator in the action's unit of work before `handle` and records a
 *           review item when the answers differ or the document's rule version is older; it never refuses the call.
 *           The action's `handle` applies the server's figure.
 * Runtime: isomorphic
 * Governing contract: ADR 0337 (decisions 4 and 5: the server re-evaluates and wins; the oldest accepted version is
 *                     an explicit line in the action).
 */
import type { AnyClass } from "@stackra/container";

import type { RuleEvaluator } from "#core/types/rule-evaluator.type";

/** The client rule code an action accepts. */
export interface ActionAccepts {
  /** The oldest rule package version accepted without review, dotted numbers (`"2.4.0"`). */
  readonly ruleVersion: string;

  /** The class that re-evaluates a document on the server. */
  readonly evaluator: AnyClass<RuleEvaluator>;
}
