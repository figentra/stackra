/**
 * Stackra file contract:
 * Purpose: `Message`, one message of a conversation: its position, its role, the run that wrote it, and its content
 *          (the AI SDK `ModelMessage` as JSON) sealed with the tenant's key.
 * Boundary: data only. Key `ai.message`, table `ai.messages`, public ids `aimsg_…`, append-only, owned through
 *           `BelongsToTenant`. `content` never holds plain text at rest: `TenantKeyCast` seals it bound to
 *           `ai.messages.content` and the owning tenant, so a row copied to another tenant does not open. The only
 *           place prompt and response text is stored (ADR 0100 decision 9); retention is a data policy, not a column.
 * Runtime: node
 * Governing contract: ADR 0100 (decisions 9 and 10: `ai_messages`); ADR 0188 (decision 2: tenant data keys); ADR 0399.
 */
import type { OptionalProps } from "@stackra/database";
import { AppendOnly, HasPublicId, Model } from "@stackra/model";
import { BelongsToTenant } from "@stackra/tenancy/node";

/** A message as a row. */
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: merged with the [OptionalProps] augmentation below
export class Message extends Model.with(HasPublicId("aimsg"), BelongsToTenant, AppendOnly) {
  /** The conversation's public id. */
  conversationId!: string;

  /** The run that wrote it. */
  runId!: string;

  /** Its place in the conversation, from 0. */
  position!: number;

  /** The message role (`user`, `assistant`, `tool`). */
  role!: string;

  /** The `ModelMessage` as JSON, sealed with the tenant's key. */
  content!: string;

  /** When it was stored. */
  at!: Date;
}

// shortcut: written by hand until gen writes the entity files (STA-339).
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: the generated `[OptionalProps]` augmentation merges into the model, as gen's entity files do
export interface Message {
  [OptionalProps]?: "id" | "tenantId";
}
