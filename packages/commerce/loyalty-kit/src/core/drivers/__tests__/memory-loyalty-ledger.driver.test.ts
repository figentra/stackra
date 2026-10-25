/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryLoyaltyLedgerDriver`: appends once per (member, reference), sums per member, covers
 *          debits atomically (two racing debits of the whole balance write one), and expires stale earns once each,
 *          cut at zero so a spent earn never takes the balance negative (the sample's recorded defect).
 * Boundary: test only; the driver is constructed directly.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0266 (decision 2); ADR 0220 (decisions 4 and 5).
 */
import { describe, expect, it } from "@stackra/testing";

import { DebitOutcome } from "#contracts/enums/debit-outcome.enum";
import { EntryKind } from "#contracts/enums/entry-kind.enum";
import { LoyaltyLedger } from "#contracts/ports/loyalty-ledger.port";
import { MemoryLoyaltyLedgerDriver } from "#core/drivers/memory-loyalty-ledger.driver";
import { memberId } from "#core/functions/member-id.function";
import { pointsEntry } from "#testing/points-entry.fixture";

const usr1 = memberId("usr_1");
const usr2 = memberId("usr_2");
const old = new Date("2025-01-01T00:00:00Z");
const cutoff = new Date("2026-01-01T00:00:00Z");

describe("MemoryLoyaltyLedgerDriver", () => {
  it("is a LoyaltyLedger", () => {
    expect(new MemoryLoyaltyLedgerDriver()).toBeInstanceOf(LoyaltyLedger);
  });

  it("appends once per member and reference and sums per member", async () => {
    const ledger = new MemoryLoyaltyLedgerDriver();
    const earn = pointsEntry.build({ memberId: usr1, points: 100, reference: "ord_1" });

    expect(await ledger.append(earn)).toBe(true);
    expect(await ledger.append(earn)).toBe(false);
    expect(await ledger.append({ ...earn, memberId: usr2 })).toBe(true);

    expect(await ledger.balance(usr1)).toBe(100);
    expect(await ledger.find(usr1, "ord_1")).toEqual(earn);
    expect(await ledger.find(usr1, "ord_2")).toBeNull();
  });

  it("writes one of two concurrent debits of the whole balance and refuses the other", async () => {
    const ledger = new MemoryLoyaltyLedgerDriver();
    await ledger.append(pointsEntry.build({ memberId: usr1, points: 100, reference: "ord_0" }));
    const debit = (reference: string) =>
      ledger.debit(
        pointsEntry.build({ memberId: usr1, points: -100, kind: EntryKind.Hold, reference }),
      );

    const outcomes = await Promise.all([debit("hold:ord_1"), debit("hold:ord_2")]);

    expect(outcomes.toSorted()).toEqual([DebitOutcome.Uncovered, DebitOutcome.Written]);
    expect(await debit("hold:ord_1")).toBe(DebitOutcome.Duplicate);
    expect(await ledger.balance(usr1)).toBe(0);
  });

  it("expires only stale earns, once", async () => {
    const ledger = new MemoryLoyaltyLedgerDriver();
    await ledger.append(
      pointsEntry.build({ memberId: usr1, points: 100, reference: "ord_1", at: old }),
    );
    await ledger.append(
      pointsEntry.build({ memberId: usr1, points: 50, reference: "ord_2", at: cutoff }),
    );

    expect(await ledger.expire(usr1, cutoff)).toBe(100);
    expect(await ledger.expire(usr1, cutoff)).toBe(0);
    expect(await ledger.balance(usr1)).toBe(50);
    expect(await ledger.find(usr1, "expire:ord_1")).toMatchObject({
      points: -100,
      kind: EntryKind.Expire,
      at: cutoff,
    });
  });

  it("cuts an expiry at zero when the earn's points were spent, and never takes the rest later", async () => {
    const ledger = new MemoryLoyaltyLedgerDriver();
    await ledger.append(
      pointsEntry.build({ memberId: usr1, points: 100, reference: "ord_1", at: old }),
    );
    await ledger.append(
      pointsEntry.build({ memberId: usr1, points: 40, reference: "ord_2", at: old }),
    );
    await ledger.debit(
      pointsEntry.build({
        memberId: usr1,
        points: -120,
        kind: EntryKind.Redeem,
        reference: "ord_3",
      }),
    );

    expect(await ledger.expire(usr1, cutoff)).toBe(20);
    expect(await ledger.balance(usr1)).toBe(0);
    expect((await ledger.find(usr1, "expire:ord_1"))?.points).toBe(-20);
    expect((await ledger.find(usr1, "expire:ord_2"))?.points).toBe(0);

    await ledger.append(pointsEntry.build({ memberId: usr1, points: 30, reference: "ord_4" }));
    expect(await ledger.expire(usr1, cutoff)).toBe(0);
    expect(await ledger.balance(usr1)).toBe(30);
  });
});
