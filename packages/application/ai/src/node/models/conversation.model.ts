/**
 * Stackra file contract:
 * Purpose: `Conversation`, one stored conversation between a human principal and an agent, with the scope node and the
 *          record it is about.
 * Boundary: data only. Key `ai.conversation`, table `ai.conversations`, public ids `aiconv_…`, owned through
 *           @stackra/tenancy's `BelongsToTenant` under its forced equality policy. No text: the messages are
 *           `ai.messages`, sealed with the tenant's key. Rows are written by `PostgresConversationStoreDriver`.
 * Runtime: node
 * Governing contract: ADR 0100 (decisions 9 and 10: `ai_conversations`); ADR 0399 (storage home); ADR 0294
 *                     (decisions 4, 11, 20 and 27); ADR 0239 (equality on `tenant_id`).
 */
import type { OptionalProps } from "@stackra/database";
import { HasPublicId, Model, Timestamps } from "@stackra/model";
import { BelongsToTenant } from "@stackra/tenancy/node";

/** A conversation as a row. */
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: merged with the [OptionalProps] augmentation below
export class Conversation extends Model.with(HasPublicId("aiconv"), BelongsToTenant, Timestamps) {
  /** The agent's key. */
  agent!: string;

  /** The human principal it belongs to: the public id the agent acts for. */
  principalId!: string;

  /** The scope node it was opened in; null for a platform conversation. */
  scopeId: string | null = null;

  /** The kind of record it is about (`matter`); null when none. */
  recordKind: string | null = null;

  /** The public id of the record it is about; null when none. */
  recordId: string | null = null;
}

/** The insert-optional fields of `Conversation`, merged into the model class (MikroORM `[OptionalProps]`). */
// shortcut: the `[OptionalProps]` augmentation is written by hand so `Repository.insert` may leave out the minted id,
// the tenant the trait fills and the defaulted fields; remove it once gen writes the entity files (STA-339).
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: the generated `[OptionalProps]` augmentation merges into the model, as gen's entity files do
export interface Conversation {
  /** The fields an insert may leave out: minted ids, trait-filled columns and defaulted fields. */
  [OptionalProps]?:
    | "id"
    | "tenantId"
    | "createdAt"
    | "updatedAt"
    | "scopeId"
    | "recordKind"
    | "recordId";
}
