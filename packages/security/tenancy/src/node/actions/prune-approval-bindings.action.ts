/**
 * Stackra file contract:
 * Purpose: `PruneApprovalBindingsAction`, `tenancy.approval_binding.prune@1`: the daily job that deletes the approval
 *          bindings whose `expiresAt` + the 24-hour execution tail + `AUDIT_HOT_RETENTION` has passed.
 * Boundary: a job is an action with a `job` surface: unique per tenant, five minutes at most, dispatched at 04:15 UTC
 *           once per tenant on the default queue. The only actor is the system, so it gets no endpoint and no tool. It
 *           is the only delete of the insert-only binding table; the tenant's policy limits it to that tenant's rows.
 *           Its input and output are `Schema` classes in schemas/. STA-1724 kept them plain types to spare tenancy a
 *           `@stackra/validation` dependency "until gen needs a schema for it"; gen refused the plain types
 *           (`action_handle_signature`), so the lead revisited it on 2026-11-01 (STA-1884).
 * Runtime: node
 * Governing contract: ADR 0509 (N7: only this job deletes a binding); ADR 0212 (decision 6: retention); ADR 0294
 *                     (decisions 16, 18 and 21); ADR 0305 (rule 28: the job surface); ADR 0148 (queue and scheduler).
 */
import { Action } from "@stackra/actions";
import type { ActionContext } from "@stackra/actions";
import type { ApprovalBindingStore } from "@stackra/actions/contracts";
import { ActorKind, AUDIT_HOT_RETENTION, Duration } from "@stackra/contracts";

import type { PruneApprovalBindingsInput } from "#node/schemas/prune-approval-bindings-input.schema";
import { PruneApprovalBindingsOutput } from "#node/schemas/prune-approval-bindings-output.schema";

/** The execution tail: a granted request may run until 24 hours after its grant, whatever its window. */
const EXECUTION_TAIL = Duration.hours(24);

/**
 * Deletes the bindings nothing can use or audit any more.
 *
 * @example
 * const { deleted } = await pipeline.execute(PruneApprovalBindingsAction, {}, { actor: systemActor });
 */
export class PruneApprovalBindingsAction extends Action({
  key: "approval_binding.prune",
  actors: [ActorKind.System],
  job: {
    unique: true,
    timeout: "5m",
    cron: {
      schedule: "15 4 * * *",
      perScope: true,
    },
  },
}) {
  /** The binding store, tenant-scoped by its policy. */
  private readonly bindings: ApprovalBindingStore;

  /**
   * @param bindings - the binding store.
   */
  constructor(bindings: ApprovalBindingStore) {
    super();
    this.bindings = bindings;
  }

  /** Deletes every binding that expired before `now - (24 hours + the retention window)`. */
  async handle(
    _input: PruneApprovalBindingsInput,
    ctx: ActionContext,
  ): Promise<PruneApprovalBindingsOutput> {
    const kept =
      Duration.toMilliseconds(EXECUTION_TAIL) + Duration.toMilliseconds(AUDIT_HOT_RETENTION);
    const cutoff = new Date(ctx.now().getTime() - kept);
    return PruneApprovalBindingsOutput.create({ deleted: await this.bindings.prune(cutoff) });
  }
}
