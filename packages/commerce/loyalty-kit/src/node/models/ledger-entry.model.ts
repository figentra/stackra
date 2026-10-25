/**
 * Stackra file contract:
 * Purpose: `LedgerEntry`, the persisted points ledger row the Postgres driver writes through `Journal<LedgerEntry>`.
 * Boundary: data, relations and indexes. Key `loyalty_kit.ledger_entry`, table `loyalty_kit.ledger_entries`, public
 *           ids `lpe_…`. Owned through @stackra/tenancy's `BelongsToTenant` (ADR 0323 d1 allows the use), append-only
 *           by trait: corrections are new entries, never updates. The unique index over the scope column, member and
 *           reference is the journal's idempotency key. `@Journaled` maps the journal's account and amount onto
 *           `memberId` and `points` and makes zero the default floor, so no debit or expiry the journal makes takes a
 *           balance negative. The account relation stays null for journal rows until the backfill (expand step).
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 4, 11, 20 and 27); ADR 0220 (decisions 4 and 5); ADR 0159; ADR 0321 and 0323
 *                     d1 (`BelongsToTenant` is tenancy's).
 */
import type { OptionalProps } from "@stackra/database";
import { Journaled } from "@stackra/ledger";
import { AppendOnly, HasPublicId, Index, ManyToOne, Model, type Ref } from "@stackra/model";
import { BelongsToTenant } from "@stackra/tenancy/node";
import { Int, Str } from "@stackra/validation";

import type { EntryKind } from "#contracts/enums/entry-kind.enum";
import { MAX_POINTS_PER_ENTRY } from "#core/constants/max-points-per-entry.constant";
import { LoyaltyAccount } from "#node/models/loyalty-account.model";

/** One ledger entry as a row. */
@Index(["tenantId", "memberId", "reference"], { unique: true })
@Journaled({ account: "memberId", amount: "points", floor: 0 })
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: merged with the [OptionalProps] augmentation below
export class LedgerEntry extends Model.with(HasPublicId("lpe"), BelongsToTenant, AppendOnly) {
  /** The owning account; null until the backfill job fills it (expand step). */
  @ManyToOne(() => LoyaltyAccount)
  account: Ref<LoyaltyAccount> | null = null;

  /** The principal the points belong to; denormalised from the account for the unique index. */
  @Str({ max: 64 })
  memberId!: string;

  /** Points moved: positive earns, negative redeems; bounded by MAX_POINTS_PER_ENTRY either way. */
  @Int({ min: -MAX_POINTS_PER_ENTRY, max: MAX_POINTS_PER_ENTRY })
  points!: number;

  /** Why the row exists. */
  kind!: EntryKind;

  /** The cause (an order id, a campaign id); unique per scope and member. */
  @Str({ max: 120 })
  reference!: string;

  /** When the cause happened, as the caller reported it. */
  at!: Date;
}

// shortcut: the `[OptionalProps]` augmentation is written by hand so `Repository.insert` may leave out the minted id,
// the scope column the trait fills and the account the backfill sets; remove it once gen writes the entity files
// (STA-339).
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: the generated `[OptionalProps]` augmentation merges into the model, as gen's entity files do
export interface LedgerEntry {
  [OptionalProps]?: "id" | "tenantId" | "account";
}
