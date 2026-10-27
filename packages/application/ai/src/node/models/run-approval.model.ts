/**
 * Stackra file contract:
 * Purpose: `RunApproval`, an approval a run's tool call was parked on: the gate's approval id, the run, the tool call,
 *          the action and where it stands.
 * Boundary: data only. Key `ai.run_approval`, table `ai.approvals`, public ids `aiappr_…`, owned through
 *           `BelongsToTenant`; one row per approval id, its status updated as it resolves. The request itself is the
 *           tasks-approvals service's.
 * Runtime: node
 * Governing contract: ADR 0100 (decisions 5 and 10: `ai_approvals`); ADR 0399.
 */
import type { OptionalProps } from "@stackra/database";
import { HasPublicId, Model, Timestamps } from "@stackra/model";
import { BelongsToTenant } from "@stackra/tenancy/node";

import type { RunApprovalStatus } from "#contracts/enums/run-approval-status.enum";

/** An approval as a row. */
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: merged with the [OptionalProps] augmentation below
export class RunApproval extends Model.with(HasPublicId("aiappr"), BelongsToTenant, Timestamps) {
  /** The parked request's id, from the approval gate; unique. */
  approvalId!: string;

  /** The run's public id. */
  runId!: string;

  /** The parked tool call. */
  toolCallId!: string;

  /** The action key it dispatches. */
  tool!: string;

  /** Where it stands. */
  status!: RunApprovalStatus;
}

/** The insert-optional fields of `RunApproval`, merged into the model class (MikroORM `[OptionalProps]`). */
// shortcut: written by hand until gen writes the entity files (STA-339).
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: the generated `[OptionalProps]` augmentation merges into the model, as gen's entity files do
export interface RunApproval {
  /** The fields an insert may leave out: minted ids, trait-filled columns and defaulted fields. */
  [OptionalProps]?: "id" | "tenantId" | "createdAt" | "updatedAt";
}
