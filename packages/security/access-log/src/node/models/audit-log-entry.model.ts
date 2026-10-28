/**
 * Stackra file contract:
 * Purpose: `AuditLogEntry`, the persisted write audit `PostgresAuditTrailDriver` stores: one audited action call, one
 *          link of its tenant's audit hash chain.
 * Boundary: data and indexes. Key `access_log.audit_log_entry`, table `access_log.audit_log_entries` (the package's
 *           Postgres schema, beside the access records, ADR 0465 decision 4), public ids `aud_…`. Tenant-owned through
 *           @stackra/tenancy's `BelongsToTenant`, so the rows a session sees, and the chain it extends, are its
 *           tenant's; append-only by trait and by a trigger. Every index is declared here, so `stackra db diff` never
 *           proposes dropping one; the unique (tenant, sequence) index keeps each chain linear. The ORM loads rows
 *           without running the constructor.
 * Runtime: node
 * Governing contract: ADR 0212 (decisions 3 and 4); ADR 0136 (decision 5); ADR 0465 (decision 4); ADR 0294 (decisions
 *                     4, 20 and 27); ADR 0321 and 0323 d1 (`BelongsToTenant` is tenancy's).
 */
import type { Actor, Json } from "@stackra/contracts";
import type { OptionalProps } from "@stackra/database";
import { AppendOnly, HasPublicId, Index, Model } from "@stackra/model";
import { BelongsToTenant } from "@stackra/tenancy/node";
import { Field, Int, Str } from "@stackra/validation";
import { z } from "zod";

/** One stored audit record; the actor, the effects and the fields are jsonb, ids only, as the pipeline wrote them. */
@Index(["tenantId", "sequence"], { unique: true })
@Index(["tenantId", "callId"])
@Index(["tenantId", "key"])
@Index(["at"])
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: merged with the [OptionalProps] augmentation below
export class AuditLogEntry extends Model.with(HasPublicId("aud"), BelongsToTenant, AppendOnly) {
  /** The id of the audited action call. */
  @Str({ max: 64 })
  callId!: string;

  /** The action's locked key. */
  @Str({ max: 200 })
  key!: string;

  /** The derived permission, when gen registered one. */
  @Str({ max: 200 })
  permission!: string | null;

  /** The permission's risk, L0 to L4. */
  @Str({ max: 2 })
  risk!: string | null;

  /** The scope node the call acted in. */
  @Str({ max: 64 })
  scopeId!: string | null;

  /** The surface the call arrived through. */
  @Str({ max: 32 })
  originKind!: string | null;

  /** The public id of the storefront, API key or agent the call came from. */
  @Str({ max: 64 })
  originId!: string | null;

  /** ok, or refused. */
  // reason: a two-value literal union kept as `AuditEntry` publishes it
  @Field(z.enum(["ok", "refused"]))
  outcome!: "ok" | "refused";

  /** The refusal code of a refused call. */
  @Str({ max: 100 })
  code!: string | null;

  /** The record's position in its tenant's audit chain, from 1. */
  @Int({ min: 1 })
  sequence!: number;

  /** The hash of the record before it in the chain. */
  @Str({
    min: 64,
    max: 64,
  })
  previousHash!: string;

  /** SHA-256 of the previous hash, the sequence and the record. */
  @Str({
    min: 64,
    max: 64,
  })
  hash!: string;

  /** The permission's effect tags. */
  effects!: string[];

  /** The actor with its onBehalfOf chain, ids only. */
  actor!: Actor;

  /** That scope node's path. */
  scopePath!: string | null;

  /** The fields the handler added with ctx.audit. */
  fields!: Record<string, Json>;

  /** When the call started, from the pipeline clock. */
  at!: Date;
}

/** The insert-optional fields of `AuditLogEntry`, merged into the model class (MikroORM `[OptionalProps]`). */
// shortcut: the `[OptionalProps]` augmentation is written by hand so `Repository.insert` may leave out the tenant the
// trait fills; remove it once gen writes the entity files (STA-339).
export interface AuditLogEntry {
  /** The fields an insert may leave out: minted ids, trait-filled columns and defaulted fields. */
  [OptionalProps]?: "tenantId";
}
