/**
 * Stackra file contract:
 * Purpose: unit tests of `ExpirePointsAction`: a system-only nightly job, unique per scope; one run visits up to
 *          `batchSize` active accounts oldest-updated first and expires each at the call's instant minus the window,
 *          reporting the points the floored expiries removed and recording one `points.expired` per account that lost
 *          points.
 * Boundary: test only; the action is called directly with a stand-in account service, the memory ledger and
 *           `fakeSettings` holding a six-month window, so no database runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0148; ADR 0305 (rule 28); ADR 0220; ADR 0454 (decision 4).
 */
import { fakeActionContext } from "@stackra/actions/testing";
import { kindOf } from "@stackra/container";
import { ActorKind, SortDirection } from "@stackra/contracts";
import { takeRecordedEvents } from "@stackra/events";
import { fakeSettings } from "@stackra/settings/testing";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { EntryKind } from "#contracts/enums/entry-kind.enum";
import { MemoryLoyaltyLedgerDriver } from "#core/drivers/memory-loyalty-ledger.driver";
import { memberId } from "#core/functions/member-id.function";
import { LoyaltyAccountPermissions } from "#node/access/loyalty-account.permissions";
import { ExpirePointsAction } from "#node/actions/expire-points.action";
import { PointsExpired } from "#node/events/points-expired.event";
import { LoyaltyKitSettings } from "#node/loyalty-kit.settings";
import { LoyaltyAccount } from "#node/models/loyalty-account.model";
import { ExpirePointsInput } from "#node/schemas/expire-points-input.schema";
import type { AccountService } from "#node/services/account.service";
import { pointsEntry } from "#testing/points-entry.fixture";

describe("ExpirePointsAction", () => {
  it("is a system-only nightly job, unique per scope", () => {
    expect(kindOf(ExpirePointsAction)?.options).toMatchObject({
      key: "points.expire",
      permission: LoyaltyAccountPermissions.expire,
      actors: [ActorKind.System],
      job: {
        unique: true,
        timeout: "5m",
        retries: 3,
        cron: { schedule: "0 3 * * *", perScope: true, input: { batchSize: 500 } },
      },
    });
  });

  it("expires each active account at the window's cutoff, floored at zero", async () => {
    const ledger = new MemoryLoyaltyLedgerDriver();
    const old = new Date("2026-01-01T00:00:00Z");
    // usr_1 earned 100 long ago and spent 70 since: only 30 may expire
    await ledger.append(
      pointsEntry.build({ memberId: memberId("usr_1"), points: 100, reference: "ord_1", at: old }),
    );
    await ledger.debit(
      pointsEntry.build({
        memberId: memberId("usr_1"),
        points: -70,
        kind: EntryKind.Redeem,
        reference: "ord_2",
      }),
    );
    await ledger.append(
      pointsEntry.build({ memberId: memberId("usr_2"), points: 50, reference: "ord_3", at: old }),
    );
    const accounts = ["usr_1", "usr_2"].map((id) =>
      Object.assign(new LoyaltyAccount(), { memberId: id }),
    );
    const find = vi.fn(async (_where: object, _options: object) => accounts);
    const action = new ExpirePointsAction(
      { find } as unknown as AccountService,
      ledger,
      fakeSettings([[LoyaltyKitSettings, { expiryMonths: 6 }]]),
    );
    const now = new Date("2026-10-21T03:00:00Z");

    const output = await action.handle(
      ExpirePointsInput.create({ batchSize: 2 }),
      fakeActionContext({ now: () => new Date(now) }),
    );

    expect(find).toHaveBeenCalledWith(
      { isFrozen: false },
      { limit: 2, orderBy: { updatedAt: SortDirection.Asc } },
    );
    expect({ ...output }).toEqual({ accounts: 2, points: 80 });
    expect(await ledger.balance(memberId("usr_1"))).toBe(0);
    expect((await ledger.find(memberId("usr_1"), "expire:ord_1"))?.at).toEqual(
      new Date("2026-04-21T03:00:00Z"),
    );
    expect(takeRecordedEvents(accounts[0] as LoyaltyAccount)).toEqual([
      PointsExpired.create({
        memberId: "usr_1",
        points: 30,
        cutoff: "2026-04-21T03:00:00.000Z",
        balanceAfter: 0,
      }),
    ]);
  });

  it("records nothing for an account whose expiry took no points", async () => {
    const ledger = new MemoryLoyaltyLedgerDriver();
    const account = Object.assign(new LoyaltyAccount(), { memberId: "usr_3" });
    const action = new ExpirePointsAction(
      { find: async () => [account] } as unknown as AccountService,
      ledger,
      fakeSettings([[LoyaltyKitSettings, { expiryMonths: 6 }]]),
    );

    const output = await action.handle(
      ExpirePointsInput.create({ batchSize: 1 }),
      fakeActionContext({ now: () => new Date("2026-10-21T03:00:00Z") }),
    );

    expect({ ...output }).toEqual({ accounts: 1, points: 0 });
    expect(takeRecordedEvents(account)).toEqual([]);
  });
});
