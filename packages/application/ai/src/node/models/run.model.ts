/**
 * Stackra file contract:
 * Purpose: `Run`, one agent run: its conversation and agent, the acting principal, where it acts, its status, the tool
 *          call it is parked on (an approval, or a client tool and its surface), its step count and error code, and when it ended.
 * Boundary: data only. Key `ai.run`, table `ai.runs`, public ids `airun_…`, owned through `BelongsToTenant`. No prompt
 *           or response text (ADR 0100 decision 9). Rows are written by `PostgresRunStoreDriver`.
 * Runtime: node
 * Governing contract: ADR 0100 (decisions 2, 3, 9 and 10: `ai_runs`); ADR 0399; ADR 0490 (decision 4).
 */
import type { Actor, ScopeRef } from "@stackra/contracts";
import type { OptionalProps } from "@stackra/database";
import { HasPublicId, Model, Timestamps } from "@stackra/model";
import { BelongsToTenant } from "@stackra/tenancy/node";
import { Int } from "@stackra/validation";

import type { RunStatus } from "#contracts/enums/run-status.enum";

/** A run as a row. */
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: merged with the [OptionalProps] augmentation below
export class Run extends Model.with(HasPublicId("airun"), BelongsToTenant, Timestamps) {
  /** The steps taken so far. */
  @Int
  steps = 0;

  /** The conversation's public id. */
  conversationId!: string;

  /** The agent's key. */
  agent!: string;

  /** The acting agent principal, with the human in `onBehalfOf`. */
  actor!: Actor;

  /** The scope node it acts in; null for a platform run. */
  scope: ScopeRef | null = null;

  /** The kind of record it works in; null when none. */
  recordKind: string | null = null;

  /** The public id of the record it works in; null when none or for a whole kind. */
  recordId: string | null = null;

  /** Where it stands. */
  status!: RunStatus;

  /** The approval it is parked on; null unless waiting. */
  pendingApprovalId: string | null = null;

  /** The tool call it is parked on; null unless waiting. */
  pendingToolCallId: string | null = null;

  /** The surface a parked client tool call went to; null unless waiting for a client tool. */
  pendingSurfaceId: string | null = null;

  /** The client tool a parked call runs; null unless waiting for a client tool. */
  pendingTool: string | null = null;

  /** When a parked client tool call stops waiting; null unless waiting for a client tool. */
  pendingExpiresAt: Date | null = null;

  /** The error or refusal code of a failed run; null otherwise. */
  errorCode: string | null = null;

  /** When it completed or failed; null while open. */
  finishedAt: Date | null = null;
}

/** The insert-optional fields of `Run`, merged into the model class (MikroORM `[OptionalProps]`). */
// shortcut: written by hand until gen writes the entity files (STA-339).
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: the generated `[OptionalProps]` augmentation merges into the model, as gen's entity files do
export interface Run {
  /** The fields an insert may leave out: minted ids, trait-filled columns and defaulted fields. */
  [OptionalProps]?:
    | "id"
    | "tenantId"
    | "createdAt"
    | "updatedAt"
    | "scope"
    | "recordKind"
    | "recordId"
    | "pendingApprovalId"
    | "pendingToolCallId"
    | "pendingSurfaceId"
    | "pendingTool"
    | "pendingExpiresAt"
    | "steps"
    | "errorCode"
    | "finishedAt";
}
