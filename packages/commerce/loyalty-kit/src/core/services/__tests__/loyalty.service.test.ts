/**
 * Stackra file contract:
 * Purpose: unit tests of `LoyaltyService`: redemption is capped by balance and by the scope's `maxRedeemPercent` and
 *          converted at its `pointValueMinor`, the base earn is pure maths at the rate given, a non-member or an overdrawn member is refused, two concurrent holds of the whole balance write
 *          one and refuse the other with no overdraft, and settle and release give held points back exactly once in
 *          either order.
 * Boundary: test only; the service is constructed directly over the memory driver and the members fake; the rates are
 *           plain arguments, as a resolved settings group passes them.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0220; ADR 0294 (decision 15).
 */
import { refusal } from "@stackra/errors/testing";
import { beforeEach, describe, expect, it } from "@stackra/testing";

import { MemoryLoyaltyLedgerDriver } from "#core/drivers/memory-loyalty-ledger.driver";
import { InsufficientPointsError } from "#core/errors/insufficient-points.error";
import { NotAMemberError } from "#core/errors/not-a-member.error";
import { memberId } from "#core/functions/member-id.function";
import { LoyaltyService } from "#core/services/loyalty.service";
import { LoyaltyMembersFake } from "#testing/loyalty-members.fake";
import { pointsEntry } from "#testing/points-entry.fixture";

/** The one enrolled member of these cases. */
const usr1 = memberId("usr_1");

/** A scope's redemption rates: a point is worth one minor unit, at most 30 % of a total. */
const RATES = { pointValueMinor: 1, maxRedeemPercent: 30 };

/** The amount still to pay that each quote caps against. */
const TOTAL = { minor: 1_000, currency: "SAR" };

/** The time of every entry. */
const at = new Date("2026-10-21T00:00:00Z");

describe("LoyaltyService", () => {
  let ledger: MemoryLoyaltyLedgerDriver;
  let loyalty: LoyaltyService;

  beforeEach(() => {
    ledger = new MemoryLoyaltyLedgerDriver();
    loyalty = new LoyaltyService(ledger, LoyaltyMembersFake.with(["usr_1"]));
  });

  it("quotes the base earn without touching the ledger", async () => {
    expect(loyalty.quoteEarn(5_000, 0.1)).toBe(500);
    expect(loyalty.quoteEarn(9, 0.1)).toBe(0);
    expect(loyalty.quoteEarn(5_000, 0.02)).toBe(100);
    expect(loyalty.pointsFor(250, 1)).toBe(250);
    expect(loyalty.pointsFor(250, 10)).toBe(25);
    expect(await ledger.balance(usr1)).toBe(0);
  });

  it("caps redemption at maxRedeemPercent of the total and at the balance", async () => {
    await ledger.append(pointsEntry.build({ memberId: usr1, points: 10_000, at }));
    expect(await loyalty.quote(usr1, 9_999, TOTAL, RATES)).toEqual({
      points: 300,
      amount: { minor: 300, currency: "SAR" },
    });
    expect(await loyalty.quote(usr1, 50, TOTAL, RATES)).toEqual({ points: 50, amount: { minor: 50, currency: "SAR" } });
    expect(await loyalty.quote(memberId("usr_2"), 50, TOTAL, RATES)).toEqual({
      points: 0,
      amount: { minor: 0, currency: "SAR" },
    });
  });

  it("converts at the scope's point value and cap", async () => {
    await ledger.append(pointsEntry.build({ memberId: usr1, points: 10_000, at }));
    // 20 % of 1 000 is 200 minor units; at 5 a point that is 40 points
    expect(
      await loyalty.quote(usr1, 9_999, TOTAL, { pointValueMinor: 5, maxRedeemPercent: 20 }),
    ).toEqual({ points: 40, amount: { minor: 200, currency: "SAR" } });
    expect(
      await loyalty.quote(usr1, 9_999, TOTAL, { pointValueMinor: 1, maxRedeemPercent: 0 }),
    ).toEqual({ points: 0, amount: { minor: 0, currency: "SAR" } });
  });

  it("refuses a redemption above the balance, and any redemption by a non-member", async () => {
    await ledger.append(pointsEntry.build({ memberId: usr1, points: 100, at }));
    await expect(loyalty.assertCanRedeem(usr1, 100)).resolves.toBeUndefined();
    await expect(loyalty.assertCanRedeem(usr1, 101)).rejects.toRefuseWith(
      refusal(InsufficientPointsError, { balance: 100, requested: 101 }),
    );
    await expect(loyalty.assertCanRedeem(memberId("usr_2"), 1)).rejects.toRefuseWith(
      refusal(NotAMemberError),
    );
  });

  it("holds one of two concurrent redemptions of the balance, refusing the other", async () => {
    await ledger.append(pointsEntry.build({ memberId: usr1, points: 100, at }));

    const first = loyalty.hold(usr1, 100, "ord_1", at);
    const second = loyalty.hold(usr1, 100, "ord_2", at);

    await expect(first).resolves.toBeUndefined();
    await expect(second).rejects.toRefuseWith(refusal(InsufficientPointsError));
    expect(await ledger.balance(usr1)).toBe(0);
  });

  it("holds once per reference, and never for a non-member", async () => {
    await ledger.append(pointsEntry.build({ memberId: usr1, points: 100, at }));

    await loyalty.hold(usr1, 60, "ord_1", at);
    await loyalty.hold(usr1, 60, "ord_1", at);

    expect(await ledger.balance(usr1)).toBe(40);
    await expect(loyalty.hold(memberId("usr_2"), 1, "ord_9", at)).rejects.toRefuseWith(
      refusal(NotAMemberError),
    );
  });

  it("gives held points back exactly once, settled or not, in either order", async () => {
    await ledger.append(pointsEntry.build({ memberId: usr1, points: 100, at }));
    await loyalty.hold(usr1, 30, "ord_1", at);
    await loyalty.hold(usr1, 20, "ord_2", at);

    expect(await loyalty.settle(usr1, "ord_1", at)).toBe(30);
    expect(await ledger.balance(usr1)).toBe(50);
    expect(await loyalty.release(usr1, "ord_1", at)).toBe(30);
    expect(await loyalty.release(usr1, "ord_2", at)).toBe(20);
    expect(await loyalty.settle(usr1, "ord_2", at)).toBe(0);
    expect(await loyalty.release(usr1, "ord_1", at)).toBe(0);
    expect(await loyalty.settle(usr1, "ord_3", at)).toBe(0);

    expect(await ledger.balance(usr1)).toBe(100);
  });

  it("redeems once per reference and refuses an uncovered redemption", async () => {
    await ledger.append(pointsEntry.build({ memberId: usr1, points: 100, at }));

    expect(await loyalty.redeem(usr1, 70, "ord_1", at)).toBe(30);
    expect(await loyalty.redeem(usr1, 70, "ord_1", at)).toBe(30);
    await expect(loyalty.redeem(usr1, 70, "ord_2", at)).rejects.toRefuseWith(
      refusal(InsufficientPointsError, { balance: 30, requested: 70 }),
    );
  });
});
