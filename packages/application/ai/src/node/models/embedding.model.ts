/**
 * Stackra file contract:
 * Purpose: `Embedding`, one embedded memory of a conversation: the message it was made from, the embedder that made
 *          it, and the hash of the embedded content.
 * Boundary: data only. Key `ai.embedding`, table `ai.embeddings`, public ids `aiemb_…`, owned through `BelongsToTenant`.
 *           No text (the text is the sealed message). The `vector` column is written and searched by SQL through the
 *           pgvector driver of @stackra/search, so this model maps the row's other columns only.
 * Runtime: node
 * Governing contract: ADR 0100 (decisions 9 and 10: `ai_embeddings`); ADR 0160 (pgvector); ADR 0399.
 */
import type { OptionalProps } from "@stackra/database";
import { HasPublicId, Model, Timestamps } from "@stackra/model";
import { BelongsToTenant } from "@stackra/tenancy/node";

/** An embedding's row, without its vector. */
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: merged with the [OptionalProps] augmentation below
export class Embedding extends Model.with(HasPublicId("aiemb"), BelongsToTenant, Timestamps) {
  /** The conversation's public id. */
  conversationId!: string;

  /** The message it was made from. */
  messageId!: string;

  /** The embedder's provider and model (`bedrock:titan-embed-v2`). */
  embedder!: string;

  /** The SHA-256 of the embedded content, hex, so a re-embed is skipped when unchanged. */
  contentHash!: string;
}

/** The insert-optional fields of `Embedding`, merged into the model class (MikroORM `[OptionalProps]`). */
// shortcut: written by hand until gen writes the entity files (STA-339).
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: the generated `[OptionalProps]` augmentation merges into the model, as gen's entity files do
export interface Embedding {
  /** The fields an insert may leave out: minted ids, trait-filled columns and defaulted fields. */
  [OptionalProps]?: "id" | "tenantId" | "createdAt" | "updatedAt";
}
