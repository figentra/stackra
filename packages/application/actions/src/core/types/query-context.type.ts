/**
 * Stackra file contract:
 * Purpose: `QueryContext`, the second parameter of a query's `handle`: the call context plus the record check
 *          (`authorize`), the reporting helpers (`period`, `startOfDay`) a read needs, the verified device the call
 *          came from (`deviceId`) and a replica query's answer (`replica`).
 * Boundary: a type only; the pipeline builds it per call. A query has no transaction, no `afterCommit`, no audit and
 *           no Idempotency-Key, so none is here. `ActionContext` extends it.
 * Runtime: isomorphic
 * Governing contract: ADR 0136 (decision 1); ADR 0294 (decision 16: input and output are the types of `handle`); ADR
 *                     0138 (as amended: the record policy runs inside `handle` through `ctx.authorize`); ADR 0338
 *                     (decisions 3 and 4: replicas; the device's last acknowledged sequence).
 */
import type { ReplicaRow } from "#contracts/types/replica-row.type";
import type { ExtensionContext } from "#core/types/extension-context.type";
import type { Period } from "#core/types/period.type";
import type { PeriodInput } from "#core/types/period-input.type";
import type { ReplicaBounds } from "#core/types/replica-bounds.type";
import type { ReplicaPage } from "#core/types/replica-page.type";

/** The context of one query call. */
export interface QueryContext extends ExtensionContext {
  /**
   * Checks the call's permission against `record` through its policy.
   * @throws Refusal `forbidden` (or the policy's own refusal) when the policy denies.
   */
  authorize(record: object): Promise<void>;

  /**
   * The window `input` names, with midnights in the call's time zone.
   * @throws RangeError for a range code it does not know, a `custom` range without `from`, or a custom `to` before
   *         `from`.
   */
  period(input: PeriodInput): Period;

  /** Midnight of the call's day in its time zone. */
  startOfDay(): Date;

  /** The device the call came from, once the transport matched it to the verified session's device; else absent. */
  readonly deviceId?: string;

  /**
   * A replica query's answer: the changes since the cursor the client sent (the input's `cursor`), or, on a first fill
   * or a cursor the log no longer holds, every row `fill` reads within the replica's bounds; with the next cursor and
   * the "as of" time.
   *
   * @param fill - reads the full replica: rows newer than `bounds.since`, newest first, at most `bounds.limit`.
   * @param slice - the caller's value of the replica's `scope` field, which `handle` has authorized; required exactly
   *                when the replica declares a `scope`.
   * @throws TypeError when the query declares no `replica`, or `slice` does not match its `scope`.
   * @throws Error when no `ReplicaLog` is bound.
   */
  replica(
    fill: (bounds: ReplicaBounds) => Promise<readonly ReplicaRow[]>,
    slice?: string,
  ): Promise<ReplicaPage>;
}
