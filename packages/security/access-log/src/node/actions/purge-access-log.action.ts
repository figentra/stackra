/**
 * Stackra file contract:
 * Purpose: `PurgeAccessLogAction`, `access_log.access_log_entry.purge@1`: the nightly job that deletes the access
 *          records older than `AccessLogConfig.retentionDays`.
 * Boundary: a job is an action with a `job` surface: unique per tenant, five minutes at most, dispatched at 03:30 UTC
 *           once per tenant on the default queue. The only actor is the system, so it gets no endpoint and no tool. Its
 *           key's model is the entry's, so the permission `access_log.access_log_entry.purge` is derived, a system
 *           permission no role grants. It is the only delete of an append-only model, made explicit by
 *           `Repository.purge`; the tenant's policy limits it to that tenant's rows. Deleting a chain's oldest links
 *           leaves the rest verifiable: `findChainBreak` anchors on the oldest kept link.
 * Runtime: node
 * Governing contract: ADR 0212 (decision 6: retention); ADR 0294 (decisions 16, 18 and 21); ADR 0305 (rule 28: the job
 *                     surface); ADR 0148 (queue and scheduler); ADR 0134.
 */
import { Action } from "@stackra/actions";
import type { ActionContext } from "@stackra/actions";
import { ActorKind } from "@stackra/contracts";
import type { Repository } from "@stackra/database";

import type { AccessLogConfig } from "#config/access-log.config";
import type { AccessLogEntry } from "#node/models/access-log-entry.model";
import type { PurgeAccessLogInput } from "#node/schemas/purge-access-log-input.schema";
import { PurgeAccessLogOutput } from "#node/schemas/purge-access-log-output.schema";

/**
 * Deletes what the retention window no longer keeps.
 *
 * @example
 * const { deleted } = await pipeline.execute(PurgeAccessLogAction, {}, { actor: systemActor });
 */
export class PurgeAccessLogAction extends Action({
  key: "access_log_entry.purge",
  actors: [ActorKind.System],
  job: {
    unique: true,
    timeout: "5m",
    cron: {
      schedule: "30 3 * * *",
      perTenant: true,
    },
  },
}) {
  /** The access record table, tenant-scoped by its policy. */
  private readonly entries: Repository<AccessLogEntry>;

  /** The retention window, read at run time so an override applies on the next tick. */
  private readonly config: AccessLogConfig;

  /**
   * @param entries - the access record table.
   * @param config - the access log's configuration.
   */
  constructor(entries: Repository<AccessLogEntry>, config: AccessLogConfig) {
    super();
    this.entries = entries;
    this.config = config;
  }

  /** Deletes, in one statement, every record recorded more than `retentionDays` before the call's instant. */
  async handle(_input: PurgeAccessLogInput, ctx: ActionContext): Promise<PurgeAccessLogOutput> {
    const cutoff = new Date(ctx.now().getTime());
    cutoff.setUTCDate(cutoff.getUTCDate() - this.config.retentionDays);
    return PurgeAccessLogOutput.create({
      deleted: await this.entries.purge({ at: { $lt: cutoff } }),
    });
  }
}
