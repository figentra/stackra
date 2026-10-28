/**
 * Stackra file contract:
 * Purpose: `ActionContext`, the second parameter of an action's `handle`: the query context plus what a write needs:
 *          the Idempotency-Key, work after commit, audit fields, a workflow behind the same key, a workflow signal,
 *          a queued job, an integration event that no model owns (`publish`, ADR 0456 decision 2) and the record
 *          version the client last read (`expectedVersion`, from If-Match).
 * Boundary: a type only; the pipeline builds it per call. `run` and `signal` reach `WorkflowRunner`, `dispatch` reaches
 *           `JobDispatcher`, `publish` reaches `EventOutbox`; calling one in an app that does not bind its port is an error
 *           naming the package. An event a model owns is recorded on the model (`record(event)`), never published here. External calls
 *           belong in `afterCommit`, never inside the transaction.
 * Runtime: isomorphic
 * Governing contract: ADR 0136 (decisions 1 to 3 and 5); ADR 0101 (a workflow behind the action); ADR 0305 (rule 28:
 *                     the job surface); ADR 0456 (decision 2: an integration event without a model).
 */
import type { AnyClass } from "@stackra/container";
import type { Json } from "@stackra/contracts";
import type { Event } from "@stackra/events";

import type { CallInput } from "#core/types/call-input.type";
import type { QueryContext } from "#core/types/query-context.type";

/** The context of one action call. */
export interface ActionContext extends QueryContext {
  /** The supplied or derived Idempotency-Key; `undefined` when the call has none. */
  readonly idempotencyKey: string | undefined;

  /**
   * The version of the record the client last read (`If-Match`), to hand to `CrudService.update(where, data,
   * { expectedVersion })`, which refuses a row that moved on with `stale_version` (409). Absent when none was sent.
   */
  readonly expectedVersion?: number;

  /**
   * Runs `work` once the call's transaction has committed, in call order; never for a refused or failed call. A
   * failure there is logged and never fails the committed call.
   */
  afterCommit: (work: () => unknown) => void;

  /** Adds `fields` to the call's audit entry (later calls overwrite a field of the same name). */
  audit: (fields: Readonly<Record<string, Json>>) => void;

  /**
   * Runs `workflow` with `input` behind this call and resolves to its output.
   * @throws Error when no `WorkflowRunner` is bound (`@stackra/workflow` is not installed).
   */
  run: <O>(workflow: AnyClass, input: unknown) => Promise<O>;

  /**
   * Delivers `payload` as `signal` to the workflow run waiting on `correlation`.
   * @throws Error when no `WorkflowRunner` is bound.
   */
  signal: (signal: AnyClass, payload: object, correlation?: object) => Promise<void>;

  /**
   * Queues `action` with `input` as a job on its declared queue.
   * @throws Error when no `JobDispatcher` is bound (`@stackra/queue` is not installed).
   */
  dispatch: <A extends object>(action: AnyClass<A>, input: CallInput<A>) => Promise<void>;

  /**
   * Writes `event`, an integration event no model owns (an alert, a notice), to the outbox in the call's unit of work,
   * with the call's id as its correlation, its actor and its scope; it leaves only if the call commits. Call it from
   * `handle`, never from `afterCommit`.
   * @throws TypeError when `event` is not an `IntegrationEvent`.
   * @throws Error when no `EventOutbox` is bound (`@stackra/outbox` is not installed).
   */
  publish: (event: Event) => Promise<void>;
}
