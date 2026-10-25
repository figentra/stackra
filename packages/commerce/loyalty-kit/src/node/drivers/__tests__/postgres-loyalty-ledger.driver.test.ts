/**
 * Stackra file contract:
 * Purpose: unit tests of `PostgresLoyaltyLedgerDriver`: every port call maps onto the journal with its floor stated (a
 *          plain append lifts it, a debit and an expiry keep zero), a floored append maps to `uncovered` and a repeat to
 *          `duplicate`, a found row maps back to a points entry, and an expiry reports the points the cut reversals
 *          removed.
 * Boundary: test only; the journal is a recording stand-in of the four calls the driver makes, so no Postgres runs. The
 *           journal's own floor, lock and reversal arithmetic are @stackra/ledger's tests; the Postgres conformance run
 *           is the testing workflow's.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0266 (decision 2); ADR 0220 (decisions 4 and 5).
 */
import type { Journal, JournalWrite } from "@stackra/ledger";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { DebitOutcome } from "#contracts/enums/debit-outcome.enum";
import { EntryKind } from "#contracts/enums/entry-kind.enum";
import { LoyaltyLedger } from "#contracts/ports/loyalty-ledger.port";
import { memberId } from "#core/functions/member-id.function";
import { PostgresLoyaltyLedgerDriver } from "#node/drivers/postgres-loyalty-ledger.driver";
import type { LedgerEntry } from "#node/models/ledger-entry.model";

const usr1 = memberId("usr_1");
const at = new Date("2026-10-21T09:00:00Z");

/** The driver over a journal whose appends answer `write`. */
function driverWith(write: JournalWrite = { written: true, belowFloor: false }) {
  const journal = {
    balance: vi.fn(async (_query: object) => 70),
    append: vi.fn(async (_entry: object, _options?: object) => write),
    find: vi.fn(async (_query: object) => ({
      account: "usr_1",
      amount: -30,
      kind: EntryKind.Hold,
      reference: "hold:ord_1",
      at,
    })),
    reverseWhere: vi.fn(async (_where: object, _reversal: object) => [
      { account: "usr_1", amount: 20, kind: EntryKind.Earn, reference: "ord_1", at },
      { account: "usr_1", amount: 0, kind: EntryKind.Earn, reference: "ord_2", at },
    ]),
  };
  const driver = new PostgresLoyaltyLedgerDriver(journal as unknown as Journal<LedgerEntry>);
  return { driver, journal };
}

describe("PostgresLoyaltyLedgerDriver", () => {
  it("is a LoyaltyLedger", () => {
    expect(driverWith().driver).toBeInstanceOf(LoyaltyLedger);
  });

  it("reads the balance of the member's account", async () => {
    const { driver, journal } = driverWith();
    expect(await driver.balance(usr1)).toBe(70);
    expect(journal.balance).toHaveBeenCalledWith({ account: usr1 });
  });

  it("appends with no floor, so a settle's redeem line is never refused", async () => {
    const { driver, journal } = driverWith();
    const entry = { memberId: usr1, points: -30, kind: EntryKind.Redeem, reference: "ord_1", at };

    expect(await driver.append(entry)).toBe(true);
    expect(journal.append).toHaveBeenCalledWith(
      { account: usr1, amount: -30, kind: EntryKind.Redeem, reference: "ord_1", at },
      { floor: null },
    );
    expect(await driverWith({ written: false, belowFloor: false }).driver.append(entry)).toBe(
      false,
    );
  });

  it("debits at floor zero and maps the journal's answer", async () => {
    const entry = {
      memberId: usr1,
      points: -100,
      kind: EntryKind.Hold,
      reference: "hold:ord_1",
      at,
    };
    const written = driverWith();

    expect(await written.driver.debit(entry)).toBe(DebitOutcome.Written);
    expect(written.journal.append).toHaveBeenCalledWith(expect.any(Object), { floor: 0 });
    expect(await driverWith({ written: false, belowFloor: true }).driver.debit(entry)).toBe(
      DebitOutcome.Uncovered,
    );
    expect(await driverWith({ written: false, belowFloor: false }).driver.debit(entry)).toBe(
      DebitOutcome.Duplicate,
    );
  });

  it("maps a found row back to a points entry, and none to null", async () => {
    const { driver, journal } = driverWith();
    expect(await driver.find(usr1, "hold:ord_1")).toEqual({
      memberId: usr1,
      points: -30,
      kind: EntryKind.Hold,
      reference: "hold:ord_1",
      at,
    });
    expect(journal.find).toHaveBeenCalledWith({ account: usr1, reference: "hold:ord_1" });
    journal.find.mockResolvedValueOnce(null as never);
    expect(await driver.find(usr1, "hold:ord_9")).toBeNull();
  });

  it("expires stale earns in one reversal floored at zero and reports the points removed", async () => {
    const { driver, journal } = driverWith();
    const cutoff = new Date("2026-01-01T00:00:00Z");

    expect(await driver.expire(usr1, cutoff)).toBe(20);
    expect(journal.reverseWhere).toHaveBeenCalledWith(
      { account: usr1, kind: EntryKind.Earn, before: cutoff },
      { kind: EntryKind.Expire, referencePrefix: "expire:", at: cutoff, floor: 0 },
    );
  });
});
