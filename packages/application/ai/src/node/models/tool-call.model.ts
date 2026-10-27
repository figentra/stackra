/**
 * Stackra file contract:
 * Purpose: `ToolCall`, one tool call of a run: the model's call id, the action key, the hash of its input, how it
 *          ended, its refusal code and the approval it was parked on.
 * Boundary: data only. Key `ai.tool_call`, table `ai.tool_calls`, public ids `aitool_…`, append-only, owned through
 *           `BelongsToTenant`. The input is a SHA-256 hash, never the input (ADR 0100 decision 9).
 * Runtime: node
 * Governing contract: ADR 0100 (decisions 3, 9 and 10: `ai_tool_calls`); ADR 0399.
 */
import type { OptionalProps } from "@stackra/database";
import { AppendOnly, HasPublicId, Model } from "@stackra/model";
import { BelongsToTenant } from "@stackra/tenancy/node";

import type { ToolCallOutcome } from "#contracts/enums/tool-call-outcome.enum";

/** A tool call as a row. */
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: merged with the [OptionalProps] augmentation below
export class ToolCall extends Model.with(HasPublicId("aitool"), BelongsToTenant, AppendOnly) {
  /** The run's public id. */
  runId!: string;

  /** The model's tool call id. */
  toolCallId!: string;

  /** The action key it dispatched. */
  tool!: string;

  /** The SHA-256 of the input's canonical JSON, hex. */
  inputHash!: string;

  /** How it ended. */
  outcome!: ToolCallOutcome;

  /** The refusal code of a refused call; null otherwise. */
  code: string | null = null;

  /** The approval a parked call waits for; null otherwise. */
  approvalId: string | null = null;

  /** When it ended. */
  at!: Date;
}

/** The insert-optional fields of `ToolCall`, merged into the model class (MikroORM `[OptionalProps]`). */
// shortcut: written by hand until gen writes the entity files (STA-339).
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: the generated `[OptionalProps]` augmentation merges into the model, as gen's entity files do
export interface ToolCall {
  /** The fields an insert may leave out: minted ids, trait-filled columns and defaulted fields. */
  [OptionalProps]?: "id" | "tenantId" | "code" | "approvalId";
}
