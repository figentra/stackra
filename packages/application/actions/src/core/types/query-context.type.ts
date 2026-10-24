/**
 * Stackra file contract:
 * Purpose: `QueryContext`, the second parameter of a query's `handle`: the call context plus the record check
 *          (`authorize`) and the reporting helpers (`period`, `startOfDay`) a read needs.
 * Boundary: a type only; the pipeline builds it per call. A query has no transaction, no `afterCommit`, no audit and
 *           no Idempotency-Key, so none is here. `ActionContext` extends it.
 * Runtime: isomorphic
 * Governing contract: ADR 0136 (decision 1); ADR 0294 (decision 16: input and output are the types of `handle`); ADR
 *                     0138 (as amended: the record policy runs inside `handle` through `ctx.authorize`).
 */
import type { ExtensionContext } from "#core/types/extension-context.type";
import type { Period } from "#core/types/period.type";
import type { PeriodInput } from "#core/types/period-input.type";

/** The context of one query call. */
export interface QueryContext extends ExtensionContext {
  /**
   * Checks the call's permission against `record` through its policy.
   * @throws Refusal `forbidden` (or the policy's own refusal) when the policy denies.
   */
  authorize(record: object): Promise<void>;

  /**
   * The window `input` names, with midnights in the call's time zone.
   * @throws RangeError for a range code it does not know, or a custom `to` before `from`.
   */
  period(input: PeriodInput): Period;

  /** Midnight of the call's day in its time zone. */
  startOfDay(): Date;
}
