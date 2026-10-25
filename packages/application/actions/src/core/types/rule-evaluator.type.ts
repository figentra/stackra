/**
 * Stackra file contract:
 * Purpose: `RuleEvaluator`, the class an action's `accepts.evaluator` names: it reads an offline-computed document from
 *          the input, loads the server's current data and runs the same pure rule function the client ran.
 * Boundary: a type only. The consumer writes the class (a binding with constructor dependencies, such as a service
 *           that holds the repositories) and the pipeline resolves it by class. It answers `undefined` when the input
 *           carries no client-computed document, so the call is not reviewed. It never refuses: a difference is a
 *           review item, never a refused sale.
 * Runtime: isomorphic
 * Governing contract: ADR 0337 (decisions 1, 2 and 4: one pure rule, run on both sides, the server wins).
 */
import type { ActionContext } from "#core/types/action-context.type";
import type { RuleEvaluation } from "#core/types/rule-evaluation.type";

/** Re-evaluates an offline-computed document on the server. */
export interface RuleEvaluator<I = never> {
  /** Both answers to the document in `input`; `undefined` when `input` carries none. */
  evaluate(input: I, ctx: ActionContext): Promise<RuleEvaluation | undefined>;
}
