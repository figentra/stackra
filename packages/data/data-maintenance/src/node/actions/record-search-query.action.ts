/**
 * Stackra file contract:
 * Purpose: `RecordSearchQueryAction`, `data_maintenance.query.record`: the job that writes one sampled search read or
 *          result click into the query log `search.queries` of @stackra/search, off the read path.
 * Boundary: a job is an action run from a queue (`QueuedSearchQueryLogDriver.record` queues it); the only actor is the
 *           system, so it gets no endpoint and no tool. It runs in the scope the read ran in, under that scope's
 *           row-level security, and writes nothing without one. A failed write retries a few times and then
 *           dead-letters: analytics, never data a read depends on. Its permission is `QueryPermissions.record`,
 *           system-held.
 * Runtime: node
 * Governing contract: ADR 0305 (rule 28: the job surface); ADR 0148 (queue); ADR 0327 (decisions 6 and 9); ADR 0462
 *                     (decision 1); data-layer gap se12 (stackra-326).
 */
import { Action, type ActionContext } from "@stackra/actions";
import { ActorKind } from "@stackra/contracts";
import type { PostgresSearchQueryLogDriver } from "@stackra/search/node";

import type { RecordSearchQueryInput } from "#node/schemas/record-search-query-input.schema";

/**
 * Writes one query log entry as a job.
 *
 * @example
 * await queue.push(RecordSearchQueryAction, { model: "Product", phrase: "linen", hits: 3, latencyMs: 9 }, { scope });
 */
export class RecordSearchQueryAction extends Action({
  key: "query.record",
  actors: [ActorKind.System],
  job: { timeout: "30s", retries: 3 },
}) {
  /** Writes the row. */
  private readonly log: PostgresSearchQueryLogDriver;

  /**
   * @param log - the Postgres query log the row is written through.
   */
  constructor(log: PostgresSearchQueryLogDriver) {
    super();
    this.log = log;
  }

  /** Writes the entry in the job's scope; nothing outside a scope. */
  async handle(input: RecordSearchQueryInput, ctx: ActionContext): Promise<void> {
    if (ctx.scope === undefined) return;
    await this.log.store(ctx.scope, {
      model: input.model,
      phrase: input.phrase ?? null,
      ...(input.hits === undefined ? {} : { hits: input.hits }),
      ...(input.latencyMs === undefined ? {} : { latencyMs: input.latencyMs }),
      ...(input.clicked === undefined ? {} : { clicked: input.clicked }),
    });
  }
}
