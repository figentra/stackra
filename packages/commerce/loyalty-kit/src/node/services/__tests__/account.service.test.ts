/**
 * Stackra file contract:
 * Purpose: unit tests of `AccountService`, the one earn path: the first earn enrolls the member at bronze, the
 *          `earnAdjust` chain applies (gold earns double), the credit is idempotent per reference and records one
 *          `points.earned` with the balance after; a frozen account is refused before anything is appended; enrolment
 *          is idempotent and records `account.enrolled` once; freezing records `account.frozen` only on a change; a
 *          visit stamps the card once per reference, at the stamp count given; the earn rate is the scope's setting,
 *          and a paused programme earns, stamps and enrolls nothing; a take-back is cut at the balance, once per
 *          reference, records `points.taken_back` with the shortfall and marks a reference that found nothing; an
 *          imported balance credits its exact points once, raises (never lowers) the tier, records `points.imported`
 *          and not `points.earned`, and goes on while the programme is paused.
 * Boundary: test only; the service runs over the memory ledger, a real `LoyaltyService`, an extension point whose slot
 *           calls the tier extension, and an in-memory stand-in for the two repository calls it makes, so no database
 *           runs. Recorded events are read with `takeRecordedEvents`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0105 as amended; ADR 0141; ADR 0265; STA-1323.
 */
import type { ExtensionContext, RequestContext } from "@stackra/actions";
import { fakeExtensionContext } from "@stackra/actions/testing";
import type { Clock, PublicId } from "@stackra/contracts";
import { takeRecordedEvents } from "@stackra/events";
import { refusal } from "@stackra/errors/testing";
import { fakeSettings } from "@stackra/settings/testing";
import { beforeEach, describe, expect, it } from "@stackra/testing";

import { EntryKind } from "#contracts/enums/entry-kind.enum";
import { LoyaltyTier } from "#contracts/enums/loyalty-tier.enum";
import type { EarnDraft } from "#contracts/types/earn-draft.type";
import { MemoryLoyaltyLedgerDriver } from "#core/drivers/memory-loyalty-ledger.driver";
import { AccountFrozenError } from "#core/errors/account-frozen.error";
import { memberId } from "#core/functions/member-id.function";
import { LoyaltyService } from "#core/services/loyalty.service";
import { AccountEnrolled } from "#node/events/account-enrolled.event";
import type { AccountFrozen } from "#node/events/account-frozen.event";
import { PointsEarned } from "#node/events/points-earned.event";
import { PointsImported } from "#node/events/points-imported.event";
import { PointsTakenBack } from "#node/events/points-taken-back.event";
import type { LoyaltyKitExtensionPoint } from "#node/extensions/loyalty-kit.extension-point";
import { TierMultiplierExtension } from "#node/extensions/tier-multiplier.extension";
import { LoyaltyKitSettings } from "#node/loyalty-kit.settings";
import { LoyaltyAccount } from "#node/models/loyalty-account.model";
import { AccountService } from "#node/services/account.service";
import { LoyaltyMembersFake } from "#testing/loyalty-members.fake";

/** One purchase of 100.00, idempotent on its order reference. */
const purchase = { amount: { minor: 10_000, currency: "SAR" }, reference: "ord_1" };

/** The clock every entry is dated by. */
const NOW = new Date("2026-10-21T00:00:00Z");

describe("AccountService", () => {
  let ledger: MemoryLoyaltyLedgerDriver;
  let accounts: AccountService;
  let stored: LoyaltyAccount[];
  /** Sets the scope's programme the next calls read. */
  const withProgramme = (values: { isActive?: boolean; earnPerMinor?: number }) =>
    Object.assign(accounts, { settings: fakeSettings([[LoyaltyKitSettings, values]]) });

  beforeEach(() => {
    ledger = new MemoryLoyaltyLedgerDriver();
    stored = [];
    const tiers = new TierMultiplierExtension();
    const extensions = {
      earnAdjust: (points: number, draft: EarnDraft, ctx: ExtensionContext) =>
        tiers.handle(points, draft, ctx),
    } as unknown as LoyaltyKitExtensionPoint;
    accounts = new AccountService(
      ledger,
      new LoyaltyService(ledger, LoyaltyMembersFake.with([])),
      extensions,
      { now: () => new Date(NOW.getTime()) } as Clock,
      { current: () => fakeExtensionContext() } as unknown as RequestContext,
      fakeSettings(),
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

  it("earns at the scope's earnPerMinor setting", async () => {
    withProgramme({ earnPerMinor: 0.02 });
    expect(await accounts.earn(memberId("usr_rate"), purchase)).toBe(200);
  });

  it("earns, stamps and enrolls nothing while the programme is paused", async () => {
    withProgramme({ isActive: false });
    const member = memberId("usr_paused");
    expect(await accounts.earn(member, purchase)).toBe(0);
    expect(await accounts.earnVisit(member, { stamps: 1, reference: "vis_1" })).toBe(0);
    expect(stored).toHaveLength(0);
    expect(await ledger.balance(member)).toBe(0);
  });

  it("credits nothing for a sub-point purchase", async () => {
    expect(
      await accounts.earn(memberId("usr_1"), {
        ...purchase,
        amount: { minor: 50, currency: "SAR" },
      }),
    ).toBe(0);
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

  it("takes points back once per reference, cut at the balance, never below zero", async () => {
    const member = memberId("usr_refund");
    await accounts.earn(member, purchase); // 100 points
    takeRecordedEvents(stored[0] as LoyaltyAccount);

    expect(await accounts.takeBack(member, 30, "rfd_1")).toBe(30);
    expect(await accounts.takeBack(member, 30, "rfd_1")).toBe(30);
    expect(await accounts.takeBack(member, 500, "rfd_2")).toBe(70);

    expect(await ledger.balance(member)).toBe(0);
    expect(await ledger.find(member, "take_back:rfd_1")).toMatchObject({
      kind: EntryKind.Adjust,
      points: -30,
    });
    expect(takeRecordedEvents(stored[0] as LoyaltyAccount)).toEqual([
      PointsTakenBack.create({
        memberId: member,
        points: 30,
        shortfall: 0,
        reference: "rfd_1",
        balanceAfter: 70,
      }),
      PointsTakenBack.create({
        memberId: member,
        points: 70,
        shortfall: 430,
        reference: "rfd_2",
        balanceAfter: 0,
      }),
    ]);
  });

  it("marks a take-back that found nothing, so a retry never takes later points", async () => {
    const member = memberId("usr_spent");
    expect(await accounts.takeBack(member, 50, "rfd_1")).toBe(0);
    await accounts.earn(member, purchase);
    expect(await accounts.takeBack(member, 50, "rfd_1")).toBe(0);
    expect(await ledger.balance(member)).toBe(100);
    await expect(accounts.takeBack(member, 0, "rfd_2")).rejects.toThrow(RangeError);
  });

  it("imports a balance once, at its exact points, raising the tier and recording points.imported", async () => {
    withProgramme({ isActive: false, earnPerMinor: 0.5 });
    const member = memberId("usr_import");

    expect(
      await accounts.importBalance(member, {
        points: 1_250,
        reference: "run_1:row_1",
        tier: LoyaltyTier.Silver,
      }),
    ).toBe(1_250);
    expect(await accounts.importBalance(member, { points: 1_250, reference: "run_1:row_1" })).toBe(
      0,
    );

    const account = stored[0] as LoyaltyAccount;
    expect(account.tier).toBe(LoyaltyTier.Silver);
    expect(await ledger.balance(member)).toBe(1_250);
    expect(await ledger.find(member, "import:run_1:row_1")).toMatchObject({
      kind: EntryKind.Earn,
      points: 1_250,
    });
    const events = takeRecordedEvents(account);
    expect(events.filter((event) => event instanceof PointsEarned)).toHaveLength(0);
    expect(events.filter((event) => event instanceof PointsImported)).toEqual([
      PointsImported.create({
        memberId: member,
        points: 1_250,
        reference: "run_1:row_1",
        tier: LoyaltyTier.Silver,
        balanceAfter: 1_250,
      }),
    ]);
  });

  it("never lowers a tier on import, and refuses a frozen account or a bad count", async () => {
    const member = memberId("usr_gold_import");
    const account = await accounts.enroll(member, LoyaltyTier.Gold);
    await accounts.importBalance(member, { points: 10, reference: "r1", tier: LoyaltyTier.Bronze });
    expect(account.tier).toBe(LoyaltyTier.Gold);

    await expect(accounts.importBalance(member, { points: 1.5, reference: "r2" })).rejects.toThrow(
      RangeError,
    );
    await accounts.setFrozen(account, true, NOW);
    await expect(
      accounts.importBalance(member, { points: 10, reference: "r3" }),
    ).rejects.toRefuseWith(refusal(AccountFrozenError, { accountId: account.id }));
    expect(await ledger.balance(member)).toBe(10);
  });
});
