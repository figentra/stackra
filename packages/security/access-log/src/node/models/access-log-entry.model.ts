/**
 * Stackra file contract:
 * Purpose: `AccessLogEntry`, the persisted access record the Postgres sink writes: one link of its tenant's hash
 *          chain.
 * Boundary: data and indexes. Key `access_log.access_log_entry`, table `access_log.access_log_entries` (the package's
 *           Postgres schema), public ids `acl_…`. Tenant-owned through @stackra/tenancy's `BelongsToTenant`, so the
 *           rows a session sees, and the chain it extends, are its tenant's; append-only by trait and by a trigger, so
 *           `PurgeAccessLogAction` is its only delete. Every index is declared here, so `stackra db diff` never
 *           proposes dropping one; the unique (tenant, sequence) index keeps each chain linear. The ORM loads rows
 *           without running the constructor.
 * Runtime: node
 * Governing contract: ADR 0212 (decisions 3 and 5); ADR 0294 (decisions 4, 20 and 27); ADR 0321 and 0323 d1
 *                     (`BelongsToTenant` is tenancy's); ADR 0134.
 */
import type { Actor, DataClassification } from "@stackra/contracts";
import type { OptionalProps } from "@stackra/database";
import { AppendOnly, HasPublicId, Index, Model } from "@stackra/model";
import { BelongsToTenant } from "@stackra/tenancy/node";
import { Int, Str } from "@stackra/validation";

/** One stored access record; the actor and the subjects are jsonb, ids only, as the sink received them. */
@Index(["tenantId", "sequence"], { unique: true })
@Index(["tenantId", "callId"])
@Index(["tenantId", "classification"])
@Index(["at"])
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: merged with the [OptionalProps] augmentation below
export class AccessLogEntry extends Model.with(HasPublicId("acl"), BelongsToTenant, AppendOnly) {
  /** The id of the action or query call the access ran in. */
  @Str({ max: 64 })
  callId!: string;

  /** The called method, as <Class>.<method>. */
  @Str({ max: 200 })
  target!: string;

  /** The data classification the class declared. */
  classification!: DataClassification;

  /** The actor with its onBehalfOf chain, ids only. */
  actor!: Actor;

  /** The public ids of the people whose data the call touched. */
  subjects!: string[];

  /** When the access was recorded. */
  at!: Date;

  /** The record's position in its tenant's hash chain, from 1. */
  @Int({ min: 1 })
  sequence!: number;

  /** The hash of the record before it in the chain. */
  @Str({ min: 64, max: 64 })
  previousHash!: string;

  /** SHA-256 of the previous hash, the sequence and the record. */
  @Str({ min: 64, max: 64 })
  hash!: string;
}

// shortcut: the `[OptionalProps]` augmentation is written by hand so `Repository.insert` may leave out the tenant the
// trait fills; remove it once gen writes the entity files (STA-339).
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: the generated `[OptionalProps]` augmentation merges into the model, as gen's entity files do
export interface AccessLogEntry {
  [OptionalProps]?: "tenantId";
}
