/**
 * Stackra file contract:
 * Purpose: unit tests of `AccountService`, the one earn path: the first earn enrolls the member at bronze, the
 *          `earnAdjust` chain applies (gold earns double), the credit is idempotent per reference and records one
 *          `points.earned` with the balance after; a frozen account is refused before anything is appended; enrolment
 *          is idempotent and records `account.enrolled` once; freezing records `account.frozen` only on a change; a
 *          visit stamps the card once per reference, at the stamp count given.
 * Boundary: test only; the service runs over the memory ledger, a real `LoyaltyService`, an extension point whose slot
 *           calls the tier extension, and an in-memory stand-in for the two repository calls it makes, so no database
 *           runs. Recorded events are read with `takeRecordedEvents`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0105 as amended; ADR 0141; ADR 0265.
 */
import type { ExtensionContext, RequestContext } from "@stackra/actions";
import { fakeExtensionContext } from "@stackra/actions/testing";
import { buildConfig } from "@stackra/config";
import type { Clock, PublicId } from "@stackra/contracts";
import { takeRecordedEvents } from "@stackra/events";
import { refusal } from "@stackra/errors/testing";
import { beforeEach, describe, expect, it } from "@stackra/testing";

import { LoyaltyKitConfig } from "#config/loyalty-kit.config";
import { LoyaltyTier } from "#contracts/enums/loyalty-tier.enum";
import type { EarnDraft } from "#contracts/types/earn-draft.type";
import { MemoryLoyaltyLedgerDriver } from "#core/drivers/memory-loyalty-ledger.driver";
import { AccountFrozenError } from "#core/errors/account-frozen.error";
import { memberId } from "#core/functions/member-id.function";
import { LoyaltyService } from "#core/services/loyalty.service";
import { AccountEnrolled } from "#node/events/account-enrolled.event";
import type { AccountFrozen } from "#node/events/account-frozen.event";
import { PointsEarned } from "#node/events/points-earned.event";
import type { LoyaltyKitExtensionPoint } from "#node/extensions/loyalty-kit.extension-point";
import { TierMultiplierExtension } from "#node/extensions/tier-multiplier.extension";
import { LoyaltyAccount } from "#node/models/loyalty-account.model";
import { AccountService } from "#node/services/account.service";
import { LoyaltyMembersFake } from "#testing/loyalty-members.fake";

/** One purchase of 100.00, idempotent on its order reference. */
const purchase = { amountMinor: 10_000, currency: "SAR", reference: "ord_1" };

/** The clock every entry is dated by. */
const NOW = new Date("2026-10-21T00:00:00Z");

describe("AccountService", () => {
  let ledger: MemoryLoyaltyLedgerDriver;
  let accounts: AccountService;
  let stored: LoyaltyAccount[];

  beforeEach(() => {
    ledger = new MemoryLoyaltyLedgerDriver();
    stored = [];
    const config = buildConfig(LoyaltyKitConfig, { values: { ledger: "memory" } });
    const tiers = new TierMultiplierExtension();
    const extensions = {
      earnAdjust: (points: number, draft: EarnDraft, ctx: ExtensionContext) =>
        tiers.handle(points, draft, ctx),
    } as unknown as LoyaltyKitExtensionPoint;
    accounts = new AccountService(
      ledger,
      new LoyaltyService(ledger, LoyaltyMembersFake.with([]), config),
      extensions,
      { now: () => new Date(NOW.getTime()) } as Clock,
      { current: () => fakeExtensionContext() } as unknown as RequestContext,
    );
    // the two repository calls the service makes, kept in memory
    Object.assign(accounts, {
      findOne: async (where: { memberId: string }) =>
        stored.find((account) => account.memberId === where.memberId) ?? null,
      create: (data: Partial<LoyaltyAccount>) => {
        const account = Object.assign(new LoyaltyAccount(), data);
        stored.push(account);
        return account;
      },
    });
  });

  it("enrolls on the first earn and credits once per reference", async () => {
    const member = memberId("usr_new");

    expect(await accounts.earn(member, purchase)).toBe(100);
    expect(await accounts.earn(member, purchase)).toBe(0);

    expect(stored).toHaveLength(1);
    expect(stored[0]?.tier).toBe(LoyaltyTier.Bronze);
    const events = takeRecordedEvents(stored[0] as LoyaltyAccount);
    expect(events.filter((event) => event instanceof AccountEnrolled)).toHaveLength(1);
    expect(events.filter((event) => event instanceof PointsEarned)).toEqual([
      PointsEarned.create({
        memberId: member,
        points: 100,
        reference: "ord_1",
        tier: LoyaltyTier.Bronze,
        balanceAfter: 100,
      }),
    ]);
    expect((await ledger.find(member, "ord_1"))?.at).toEqual(NOW);
  });

  it("applies the earnAdjust chain: gold earns double", async () => {
    const gold = memberId("usr_gold");
    await accounts.enroll(gold, LoyaltyTier.Gold);
    expect(await accounts.earn(gold, purchase)).toBe(200);
  });

  it("credits nothing for a sub-point purchase", async () => {
    expect(await accounts.earn(memberId("usr_1"), { ...purchase, amountMinor: 50 })).toBe(0);
    expect(await ledger.balance(memberId("usr_1"))).toBe(0);
  });

  it("refuses an earn on a frozen account before appending", async () => {
    const member = memberId("usr_1");
    const account = await accounts.enroll(member, LoyaltyTier.Silver);
    await accounts.setFrozen(account, true, NOW);

    await expect(accounts.earn(member, purchase)).rejects.toRefuseWith(
      refusal(AccountFrozenError, { accountId: account.id }),
    );
    expect(await ledger.balance(member)).toBe(0);
  });

  it("enrolls once, at the address the client named", async () => {
    const member = memberId("usr_1");
    const accountId = "lac_01ja0000000000000000000012" as PublicId<"lac">;

    const first = await accounts.enroll(member, LoyaltyTier.Silver, accountId);
    const second = await accounts.enroll(member, LoyaltyTier.Gold);

    expect(second).toBe(first);
    expect(first.id).toBe(accountId);
    expect(first.tier).toBe(LoyaltyTier.Silver);
    expect(
      takeRecordedEvents(first).filter((event) => event instanceof AccountEnrolled),
    ).toHaveLength(1);
  });

  it("records account.frozen only when the flag changes", async () => {
    const account = await accounts.enroll(memberId("usr_1"), LoyaltyTier.Bronze);
    takeRecordedEvents(account);

    await accounts.setFrozen(account, true, NOW);
    await accounts.setFrozen(account, true, NOW);
    expect(account.frozenAt).toEqual(NOW);
    await accounts.setFrozen(account, false, NOW);

    expect(account.frozenAt).toBeNull();
    expect(takeRecordedEvents(account).map((event) => (event as AccountFrozen).isFrozen)).toEqual([
      true,
      false,
    ]);
  });

  it("stamps a visit once per reference, with no spend rate or tier multiplier", async () => {
    const member = memberId("usr_stamps");
    await accounts.enroll(member, LoyaltyTier.Gold);

    expect(await accounts.earnVisit(member, { reference: "apt_1", stamps: 1 })).toBe(1);
    expect(await accounts.earnVisit(member, { reference: "apt_1", stamps: 1 })).toBe(0);
    expect(await accounts.earnVisit(member, { reference: "apt_2", stamps: 2 })).toBe(2);

    expect(await ledger.balance(member)).toBe(3);
    const events = takeRecordedEvents(stored[0] as LoyaltyAccount);
    expect(events.filter((event) => event instanceof PointsEarned)).toHaveLength(2);
  });

  it("refuses a frozen account and a non-positive stamp count", async () => {
    const member = memberId("usr_1");
    const account = await accounts.enroll(member, LoyaltyTier.Bronze);
    await expect(accounts.earnVisit(member, { reference: "apt_1", stamps: 0 })).rejects.toThrow(
      RangeError,
    );
    await accounts.setFrozen(account, true, NOW);
    await expect(
      accounts.earnVisit(member, { reference: "apt_1", stamps: 1 }),
    ).rejects.toRefuseWith(refusal(AccountFrozenError, { accountId: account.id }));
    expect(await ledger.balance(member)).toBe(0);
  });
});
