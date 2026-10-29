/**
 * Stackra file contract:
 * Purpose: `Message`, one message of a conversation: its position, its role, the run that wrote it, and its content
 *          (the AI SDK `ModelMessage` as JSON) sealed with the tenant's key and bound to the tenant.
 * Boundary: data only. Key `ai.message`, table `ai.messages`, public ids `aimsg_…`, append-only, owned through
 *           `BelongsToTenant`. `content` never holds plain text at rest: `HasEncryptedFields({ scope: "tenantId" })`
 *           has `EncryptedFieldsSubscriber` seal it bound to `ai.message.content@<tenantId>`, so a row copied to
 *           another tenant does not open (ADR 0476, which retired `ScopeKeyCast`); it is `@Classified` personal so
 *           export, erasure and the logs treat it as such (ADR 0465 decision 5). The only
 *           place prompt and response text is stored (ADR 0100 decision 9); retention is a data policy, not a column.
 * Runtime: node
 * Governing contract: ADR 0100 (decisions 9 and 10: `ai_messages`); ADR 0188 (decision 2: tenant data keys); ADR 0399;
 *                     ADR 0476.
 */
import { DataClassification } from "@stackra/contracts";
import type { OptionalProps } from "@stackra/database";
import { AppendOnly, HasEncryptedFields, HasPublicId, Model } from "@stackra/model";
import { BelongsToTenant } from "@stackra/tenancy/node";
import { Classified, Int } from "@stackra/validation";

/** A message as a row. */
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: merged with the [OptionalProps] augmentation below
export class Message extends Model.with(
  HasPublicId("aimsg"),
  BelongsToTenant,
  AppendOnly,
  HasEncryptedFields({ scope: "tenantId" }, "content"),
) {
  /** Its place in the conversation, from 0. */
  @Int
  position!: number;

  /** The `ModelMessage` as JSON; free text that may name a person, so personal; rests sealed with the tenant's key. */
  @Classified(DataClassification.Personal)
  content!: string;

  /** The conversation's public id. */
  conversationId!: string;

  /** The run that wrote it. */
  runId!: string;

  /** The message role (`user`, `assistant`, `tool`). */
  role!: string;

  /** When it was stored. */
  at!: Date;
}

/** The insert-optional fields of `Message`, merged into the model class (MikroORM `[OptionalProps]`). */
// shortcut: written by hand until gen writes the entity files (STA-339).
export interface Message {
  /** The fields an insert may leave out: minted ids, trait-filled columns and defaulted fields. */
  [OptionalProps]?: "id" | "tenantId";
}
