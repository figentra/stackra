/**
 * Stackra file contract:
 * Purpose: `LoyaltyAccount`, a member's loyalty account: tier and status; its points are the ledger's entries.
 * Boundary: data and indexes. Key `loyalty_kit.loyalty_account`, table `loyalty_kit.loyalty_accounts`,
 *           public ids `lac_…`. Owned through @stackra/tenancy's `BelongsToTenant` (ADR 0323 d1 allows the use). Tier
 *           and status move only through `AccountService`; recorded events reach the outbox when the unit of work
 *           flushes. The member id is the host principal's public id, whatever its prefix, classified pseudonymous.
 *           Every index is declared here (`@Index`, and the filters of `@Searchable`), so `stackra db diff` never
 *           proposes dropping one. The entries point here (`LedgerEntry.account`); no inverse collection is kept, so the
 *           two models do not import each other. The kit never hard-deletes an account: its entries are an audit record.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 4, 6, 11, 20 and 27); ADR 0133 (traits); ADR 0134 (classification); ADR
 *                     0221 (search); ADR 0321 and 0323 d1.
 */
import { DataClassification } from "@stackra/contracts";
import type { OptionalProps } from "@stackra/database";
import {
  HasPublicId,
  Index,
  Model,
  Searchable,
  SoftDeletes,
  Timestamps,
  Versioned,
} from "@stackra/model";
import { BelongsToTenant } from "@stackra/tenancy/node";
import { Classified, Str } from "@stackra/validation";

import { LoyaltyTier } from "#contracts/enums/loyalty-tier.enum";
// Loaded for its schema registration, which the value import used to bring.
import "#node/schemas/account-notes.schema";
import type { AccountNotes } from "#node/schemas/account-notes.schema";

/** One live account per scope and principal; the traits give the id, scope column, timestamps, version and soft delete. */
@Index(["tenantId", "memberId"], {
  unique: true,
  where: "deleted_at is null",
})
@Index(["tenantId", "tier"])
@Index(["tenantId", "isFrozen"])
@Index(["tenantId", "createdAt"])
@Searchable({
  text: ["memberId"],
  filters: ["tier", "isFrozen", "createdAt"],
})
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: merged with the [OptionalProps] augmentation below
export class LoyaltyAccount extends Model.with(
  HasPublicId("lac"),
  BelongsToTenant,
  Timestamps,
  Versioned,
  SoftDeletes,
) {
  /** The host principal's public id; unique per scope among live accounts; pseudonymous. */
  @Classified(DataClassification.Pseudonymous)
  @Str({ max: 64 })
  memberId!: string;

  /** Current tier; raised by RecalculateTierListener after an earn, chosen only at enrolment. */
  tier: LoyaltyTier = LoyaltyTier.Bronze;

  /** Frozen accounts earn and redeem nothing until staff unfreeze them. */
  isFrozen = false;

  /** When the account was frozen; null while active. */
  frozenAt: Date | null = null;

  /** Merchant notes; jsonb, empty until staff flag the account. */
  // A default is a constant gen can read (ADR 0294 rule 27), so the empty notes are `{}`, not `AccountNotes.create({})`.
  notes: AccountNotes = {} as AccountNotes;

  /** Whether points may move; the single rule every action checks before touching the ledger. */
  get canTransact(): boolean {
    return !this.isFrozen;
  }
}

// shortcut: the `[OptionalProps]` augmentation is written by hand so `create` may leave out what the traits and the
// initializers fill; remove it once gen writes the entity files (STA-339).
/** Marks the `LoyaltyAccount` fields the model fills itself (`[OptionalProps]`). */
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: the generated `[OptionalProps]` augmentation merges into the model, as gen's entity files do
export interface LoyaltyAccount {
  /** The fields a create may leave out, because the traits and the initializers fill them. */
  [OptionalProps]?:
    | "id"
    | "tenantId"
    | "createdAt"
    | "updatedAt"
    | "version"
    | "deletedAt"
    | "tier"
    | "isFrozen"
    | "frozenAt"
    | "notes"
    | "canTransact";
}
