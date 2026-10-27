/**
 * Stackra file contract:
 * Purpose: unit tests of `GetBalanceQuery`: the `points.balance` query on its GET route, an intent, cached a minute and
 *          dropped by `points.earned`, `points.redeemed` and `points.expired`; it authorizes against the account, then
 *          returns the ledger's balance, the tier and the next expiry: the oldest earn not yet expired plus the window,
 *          or null.
 * Boundary: test only; the query is called directly with a stand-in account service and entry repository, the memory
 *           ledger and `fakeSettings`. The cache step is the pipeline's.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0305 (rules 31 to 33); ADR 0150; ADR 0454 (decision 4).
 */
import { fakeActionContext } from "@stackra/actions/testing";
import { kindOf } from "@stackra/container";
import { HttpMethod } from "@stackra/contracts";
import type { PublicId } from "@stackra/contracts";
import type { Repository } from "@stackra/database";
import { fakeSettings } from "@stackra/settings/testing";
import { describe, expect, it } from "@stackra/testing";

import { EntryKind } from "#contracts/enums/entry-kind.enum";
import { LoyaltyTier } from "#contracts/enums/loyalty-tier.enum";
import { MemoryLoyaltyLedgerDriver } from "#core/drivers/memory-loyalty-ledger.driver";
import { memberId } from "#core/functions/member-id.function";
import { BalanceView } from "#core/schemas/balance-view.schema";
import { LoyaltyAccountPermissions } from "#node/access/loyalty-account.permissions";
import { PointsEarned } from "#node/events/points-earned.event";
import { PointsExpired } from "#node/events/points-expired.event";
import { PointsRedeemed } from "#node/events/points-redeemed.event";
import { LoyaltyKitSettings } from "#node/loyalty-kit.settings";
import { LedgerEntry } from "#node/models/ledger-entry.model";
import { LoyaltyAccount } from "#node/models/loyalty-account.model";
import { GetBalanceQuery } from "#node/queries/get-balance.query";
import { GetBalanceInput } from "#node/schemas/get-balance-input.schema";
import type { AccountService } from "#node/services/account.service";
import { pointsEntry } from "#testing/points-entry.fixture";

const accountId = "lac_01ja0000000000000000000011" as PublicId<"lac">;

/** A stored entry row. */
const row = (kind: EntryKind, reference: string, at: string) =>
  Object.assign(new LedgerEntry(), {
    memberId: "usr_1",
    points: 0,
    kind,
    reference,
    at: new Date(at),
  });

/** The query over a gold account of `usr_1` holding 1 000 points, whose stored rows are `rows`. */
async function queryWith(rows: LedgerEntry[]) {
  const account = Object.assign(new LoyaltyAccount(), {
    id: accountId,
    memberId: "usr_1",
    tier: LoyaltyTier.Gold,
  });
  const ledger = new MemoryLoyaltyLedgerDriver();
  await ledger.append(pointsEntry.build({ memberId: memberId("usr_1"), points: 1_000 }));
  const query = new GetBalanceQuery(
    { findOneOrFail: async () => account } as unknown as AccountService,
    ledger,
    { find: async () => rows } as unknown as Repository<LedgerEntry>,
    fakeSettings([[LoyaltyKitSettings, { expiryMonths: 12 }]]),
  );
  return { account, query };
}

describe("GetBalanceQuery", () => {
  it("is the points.balance query on its GET route, cached and dropped when points move", () => {
    expect(kindOf(GetBalanceQuery)?.options).toMatchObject({
      key: "points.balance",
      permission: LoyaltyAccountPermissions.read,
      endpoint: { method: HttpMethod.Get, path: "/loyalty/accounts/:accountId/balance" },
      intent: true,
      cache: { ttl: "1m", invalidateOn: [PointsEarned, PointsRedeemed, PointsExpired] },
    });
  });

  it("authorizes against the account and dates the next expiry from the oldest live earn", async () => {
    const { account, query } = await queryWith([
      row(EntryKind.Earn, "ord_0", "2025-09-01T10:00:00Z"),
      row(EntryKind.Earn, "ord_1", "2026-10-21T10:00:00Z"),
      row(EntryKind.Expire, "expire:ord_0", "2026-09-01T03:00:00Z"),
    ]);
    const ctx = fakeActionContext();

    const view = await query.handle(GetBalanceInput.create({ accountId }), ctx);

    expect(ctx.recorded.authorized).toEqual([account]);
    expect(view).toBeInstanceOf(BalanceView);
    expect({ ...view }).toEqual({
      memberId: "usr_1",
      tier: LoyaltyTier.Gold,
      balance: 1_000,
      nextExpiryAt: new Date("2027-10-21T10:00:00Z"),
    });
  });

  it("shows no expiry when nothing earned is left to expire", async () => {
    const { query } = await queryWith([]);
    const view = await query.handle(GetBalanceInput.create({ accountId }), fakeActionContext());
    expect(view.nextExpiryAt).toBeNull();
  });
});
