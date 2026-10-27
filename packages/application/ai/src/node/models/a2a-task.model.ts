/**
 * Stackra file contract:
 * Purpose: `A2aTask`, one agent-to-agent task: its direction, the remote agent, the remote task id, its A2A state and
 *          the local run it belongs to.
 * Boundary: data only. Key `ai.a2a_task`, table `ai.a2a_tasks`, public ids `aitask_…`, owned through
 *           `BelongsToTenant`. The table ships with the others of ADR 0100 decision 10; the A2A protocol and its driver
 *           are separate work, so nothing in this package writes it yet.
 * Runtime: node
 * Governing contract: ADR 0100 (decisions 7 and 10: `a2a_tasks`); ADR 0399.
 */
import type { OptionalProps } from "@stackra/database";
import { HasPublicId, Model, Timestamps } from "@stackra/model";
import { BelongsToTenant } from "@stackra/tenancy/node";

import type { A2aDirection } from "#contracts/enums/a2a-direction.enum";

/** An A2A task as a row. */
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: merged with the [OptionalProps] augmentation below
export class A2aTask extends Model.with(HasPublicId("aitask"), BelongsToTenant, Timestamps) {
  /** `inbound` (a remote agent asked us) or `outbound` (we asked a remote agent). */
  direction!: A2aDirection;

  /** The remote agent's card URL. */
  remoteAgent!: string;

  /** The task id on the remote side; null until it answers. */
  remoteTaskId: string | null = null;

  /** The A2A task state (`submitted`, `working`, `input-required`, `completed`, `failed`, `canceled`). */
  state!: string;

  /** The local run it belongs to; null when none. */
  runId: string | null = null;
}

/** The insert-optional fields of `A2aTask`, merged into the model class (MikroORM `[OptionalProps]`). */
// shortcut: written by hand until gen writes the entity files (STA-339).
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: the generated `[OptionalProps]` augmentation merges into the model, as gen's entity files do
export interface A2aTask {
  /** The fields an insert may leave out: minted ids, trait-filled columns and defaulted fields. */
  [OptionalProps]?: "id" | "tenantId" | "createdAt" | "updatedAt" | "remoteTaskId" | "runId";
}
