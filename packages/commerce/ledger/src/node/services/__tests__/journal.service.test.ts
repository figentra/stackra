/**
 * Stackra file contract:
 * Purpose: unit tests of `Journal`: appends once per (account, reference) under the model's own field names, sums an
 *          account's entries, refuses a debit below the floor (the model's default, a call's override, or none with
 *          `null`) and reports a retried debit as a duplicate, serialises concurrent debits so they never overdraw,
 *          reverses set-wise once and cuts a reversal at the floor (the loyalty kit's stale-earn expiry can no longer
 *          go negative), posts balanced lines or nothing, reads a posting's lines back by reference, and refuses floats and a model without `AppendOnly`. A model with a currency field
 *          keeps one ISO 4217 currency per posting and sums balances per currency.
 * Boundary: test only; the entries live in a memory repository that keeps the model's unique (account, reference)
 *           index, and the locks are the real `Locks` over the memory lock driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0220 (decisions 4 and 5).
 */
import type { AnyClass } from "@stackra/container";
import { Clock } from "@stackra/contracts";
import { UniqueViolation } from "@stackra/database";
import type { Repository } from "@stackra/database";
import { isRefusal } from "@stackra/errors";
import { Locks, MemoryLockDriver } from "@stackra/locking";
import { AppendOnly, Model } from "@stackra/model";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { Journaled } from "#core/decorators/journaled.decorator";
import { UnbalancedPostingError } from "#core/errors/unbalanced-posting.error";
import { journalOf } from "#node/functions/journal-of.function";
import type { Journal } from "#node/services/journal.service";

/** Why a points entry exists. */
type PointsKind = "earn" | "redeem" | "expire" | "adjust";

/** A points ledger row as the loyalty kit has it: its own field names and a floor of zero. */
@Journaled({
  account: "memberId",
  amount: "points",
  floor: 0,
})
class PointsEntry extends Model.with(AppendOnly) {
  memberId!: string;

  points!: number;

  kind!: PointsKind;

  reference!: string;

  at!: Date;
}

/** A money ledger row under the journal's own field names, with no floor. */
class CashEntry extends Model.with(AppendOnly) {
  account!: string;

  amount!: number;

  kind!: string;

  reference!: string;

  at!: Date;
}

/** A row that may be updated, which no journal accepts. */
class DraftEntry extends Model.with() {
  account!: string;
}

/** A stored row. */
type Row = Record<string, unknown>;

/** Reads the host clock. */
class HostClock extends Clock {
  now(): Date {
    return new Date();
  }
}

/** Whether `row` matches `filter`: equality, `$lt`, `$in` and `$or`, the filters the journal sends. */
function matches(row: Row, filter: Row): boolean {
  return Object.entries(filter).every(([key, expected]) => {
    if (key === "$or") return (expected as Row[]).some((branch) => matches(row, branch));
    const actual = row[key];
    if (expected !== null && typeof expected === "object" && !(expected instanceof Date)) {
      const operator = expected as { readonly $lt?: Date; readonly $in?: readonly unknown[] };
      if (operator.$lt !== undefined) return (actual as Date).getTime() < operator.$lt.getTime();
      if (operator.$in !== undefined) return operator.$in.includes(actual);
    }
    return actual === expected;
  });
}

/** A sortable form of a stored value. */
function rankOf(value: unknown): number | string {
  return value instanceof Date ? value.getTime() : String(value);
}

/** The entries of one model in memory, unique on (account field, reference field) as the model's index is. */
class MemoryEntries {
  readonly rows: Row[] = [];

  /** The account and reference fields of the unique index. */
  private readonly unique: readonly [string, string];

  constructor(account: string, reference = "reference") {
    this.unique = [account, reference];
  }

  async find(where: Row, options?: { readonly orderBy?: Row }): Promise<Row[]> {
    const keys = Object.keys(options?.orderBy ?? {});
    return this.rows
      .filter((row) => matches(row, where))
      .sort((a, b) => {
        for (const key of keys) {
          const [left, right] = [rankOf(a[key]), rankOf(b[key])];
          if (left !== right) return left < right ? -1 : 1;
        }
        return 0;
      });
  }

  async findOne(where: Row): Promise<Row | null> {
    return this.rows.find((row) => matches(row, where)) ?? null;
  }

  async count(where: Row): Promise<number> {
    return this.rows.filter((row) => matches(row, where)).length;
  }

  async sum(field: string, where: Row): Promise<number> {
    return this.rows
      .filter((row) => matches(row, where))
      .reduce((total, row) => total + Number(row[field]), 0);
  }

  async insert(data: Row): Promise<Row> {
    const [account, reference] = this.unique;
    if (
      this.rows.some((row) => row[account] === data[account] && row[reference] === data[reference])
    )
      throw new UniqueViolation(new Error("duplicate key value violates unique constraint"));
    this.rows.push(data);
    return data;
  }
}

/** A journal over `model` whose entries live in `entries`. */
function journalOver<M extends object>(model: AnyClass<M>, entries: MemoryEntries): Journal<M> {
  const clock = new HostClock();
  class MemoryJournal extends journalOf(model) {
    // journalOf's type is `Journal<M>`, whose `model` is abstract, so a subclass names it again.
    protected override readonly model: AnyClass<M> = model;

    protected override entries(): Repository<M> {
      // reason: the memory store has the repository methods the journal calls, untyped by model
      return entries as unknown as Repository<M>;
    }
  }
  return new MemoryJournal(new Locks(new MemoryLockDriver(clock), clock));
}

/** Midnight UTC on a day of January 2026. */
const day = (n: number): Date => new Date(Date.UTC(2026, 0, n));

/** A transfer line on `account`. */
const line = (account: string, amount: number) => ({
  account,
  amount,
  kind: "transfer",
  reference: "t1",
  at: day(1),
});

describe("Journal", () => {
  it("appends once per account and reference, under the model's field names", async () => {
    const entries = new MemoryEntries("memberId");
    const journal = journalOver(PointsEntry, entries);
    const earn = {
      account: "m1",
      amount: 120,
      kind: "earn",
      reference: "order-1",
      at: day(1),
    } as const;

    expect(await journal.append(earn)).toEqual({ written: true, belowFloor: false });
    expect(await journal.append(earn)).toEqual({ written: false, belowFloor: false });
    expect(entries.rows).toEqual([
      { memberId: "m1", points: 120, kind: "earn", reference: "order-1", at: day(1) },
    ]);
  });

  it("derives the balance from the account's entries and finds an entry by its reference", async () => {
    const journal = journalOver(PointsEntry, new MemoryEntries("memberId"));
    await journal.append({ account: "m1", amount: 120, kind: "earn", reference: "o1", at: day(1) });
    await journal.append({ account: "m1", amount: 30, kind: "earn", reference: "o2", at: day(2) });
    await journal.append({ account: "m2", amount: 5, kind: "earn", reference: "o1", at: day(2) });

    expect(await journal.balance({ account: "m1" })).toBe(150);
    expect(await journal.balance({ account: "m1", amount: "points" })).toBe(150);
    expect(await journal.balance({ account: "nobody" })).toBe(0);
    expect(await journal.find({ account: "m1", reference: "o2" })).toEqual({
      account: "m1",
      amount: 30,
      kind: "earn",
      reference: "o2",
      at: day(2),
    });
    expect(await journal.find({ account: "m1", reference: "missing" })).toBeNull();
  });

  it("refuses a debit below the model's floor and writes a covered one", async () => {
    const entries = new MemoryEntries("memberId");
    const journal = journalOver(PointsEntry, entries);
    await journal.append({ account: "m1", amount: 50, kind: "earn", reference: "o1", at: day(1) });

    expect(
      await journal.append({
        account: "m1",
        amount: -80,
        kind: "redeem",
        reference: "r1",
        at: day(2),
      }),
    ).toEqual({ written: false, belowFloor: true });
    expect(
      await journal.append({
        account: "m1",
        amount: -50,
        kind: "redeem",
        reference: "r2",
        at: day(2),
      }),
    ).toEqual({ written: true, belowFloor: false });
    expect(await journal.balance({ account: "m1" })).toBe(0);
    expect(entries.rows).toHaveLength(2);
  });

  it("takes a call's floor over the model's, and none with null", async () => {
    const journal = journalOver(PointsEntry, new MemoryEntries("memberId"));
    const debit = (reference: string, amount: number) =>
      ({ account: "m1", amount, kind: "adjust", reference, at: day(1) }) as const;

    expect(await journal.append(debit("a1", -10), { floor: -10 })).toMatchObject({ written: true });
    expect(await journal.append(debit("a2", -1), { floor: -10 })).toMatchObject({
      belowFloor: true,
    });
    expect(await journal.append(debit("a3", -500), { floor: null })).toMatchObject({
      written: true,
    });
    expect(await journal.balance({ account: "m1" })).toBe(-510);
    // a credit only raises a balance, so no floor refuses it, even below the floor
    expect(
      await journal.append({ account: "m1", amount: 5, kind: "earn", reference: "e1", at: day(2) }),
    ).toEqual({ written: true, belowFloor: false });
  });

  it("reports a retried debit as a duplicate, not as below the floor", async () => {
    const journal = journalOver(PointsEntry, new MemoryEntries("memberId"));
    await journal.append({ account: "m1", amount: 100, kind: "earn", reference: "o1", at: day(1) });
    const redeem = {
      account: "m1",
      amount: -100,
      kind: "redeem",
      reference: "r1",
      at: day(2),
    } as const;

    expect(await journal.append(redeem)).toEqual({ written: true, belowFloor: false });
    expect(await journal.append(redeem)).toEqual({ written: false, belowFloor: false });
  });

  it("serialises concurrent debits of one account, so they never overdraw it", async () => {
    const journal = journalOver(PointsEntry, new MemoryEntries("memberId"));
    await journal.append({ account: "m1", amount: 100, kind: "earn", reference: "o1", at: day(1) });

    const outcomes = await Promise.all(
      ["r1", "r2"].map((reference) =>
        journal.append({ account: "m1", amount: -70, kind: "redeem", reference, at: day(2) }),
      ),
    );

    expect(outcomes.filter((outcome) => outcome.written)).toHaveLength(1);
    expect(outcomes.filter((outcome) => outcome.belowFloor)).toHaveLength(1);
    expect(await journal.balance({ account: "m1" })).toBe(30);
  });

  it("reverses each matching entry once, oldest first, and never a reversal", async () => {
    const entries = new MemoryEntries("account");
    const journal = journalOver(CashEntry, entries);
    await journal.append({ account: "a1", amount: 40, kind: "earn", reference: "o2", at: day(2) });
    await journal.append({ account: "a1", amount: 60, kind: "earn", reference: "o1", at: day(1) });
    await journal.append({ account: "a1", amount: 7, kind: "earn", reference: "o3", at: day(9) });
    const expire = { kind: "expire", referencePrefix: "expire:", at: day(5) } as const;

    const reversed = await journal.reverseWhere(
      { account: "a1", kind: "earn", before: day(5) },
      expire,
    );

    expect(reversed.map((entry) => [entry.reference, entry.amount])).toEqual([
      ["o1", 60],
      ["o2", 40],
    ]);
    expect(entries.rows.filter((row) => row["kind"] === "expire")).toEqual([
      { account: "a1", amount: -60, kind: "expire", reference: "expire:o1", at: day(5) },
      { account: "a1", amount: -40, kind: "expire", reference: "expire:o2", at: day(5) },
    ]);
    expect(
      await journal.reverseWhere({ account: "a1", kind: "earn", before: day(5) }, expire),
    ).toEqual([]);
    // without a kind the reversals match too, and are skipped: only o3 is left to reverse
    const rest = await journal.reverseWhere({ account: "a1" }, expire);
    expect(rest.map((entry) => entry.reference)).toEqual(["o3"]);
    expect(await journal.balance({ account: "a1" })).toBe(0);
  });

  it("reverses in full where no floor applies, even below zero", async () => {
    const journal = journalOver(CashEntry, new MemoryEntries("account"));
    await journal.append({ account: "a1", amount: 100, kind: "earn", reference: "o1", at: day(1) });
    await journal.append({
      account: "a1",
      amount: -80,
      kind: "redeem",
      reference: "r1",
      at: day(2),
    });

    const reversed = await journal.reverseWhere(
      { account: "a1", kind: "earn", before: day(3) },
      { kind: "expire", referencePrefix: "expire:", at: day(3) },
    );

    expect(reversed.map((entry) => entry.amount)).toEqual([100]);
    expect(await journal.balance({ account: "a1" })).toBe(-80);
  });

  it("cuts a reversal at the floor and still records the cut one, so spent points never go negative", async () => {
    const entries = new MemoryEntries("memberId");
    const journal = journalOver(PointsEntry, entries);
    await journal.append({ account: "m1", amount: 100, kind: "earn", reference: "o1", at: day(1) });
    await journal.append({ account: "m1", amount: 30, kind: "earn", reference: "o2", at: day(2) });
    await journal.append({
      account: "m1",
      amount: -110,
      kind: "redeem",
      reference: "r1",
      at: day(3),
    });
    const expire = { kind: "expire", referencePrefix: "expire:", at: day(4) } as const;

    const reversed = await journal.reverseWhere(
      { account: "m1", kind: "earn", before: day(4) },
      expire,
    );

    // 20 points were left: the older earn takes them all, the newer one is cut to nothing
    expect(reversed.map((entry) => [entry.reference, entry.amount])).toEqual([
      ["o1", 20],
      ["o2", 0],
    ]);
    expect(await journal.balance({ account: "m1" })).toBe(0);
    expect(
      entries.rows.filter((row) => row["kind"] === "expire").map((row) => row["points"]),
    ).toEqual([-20, 0]);
    // a later earn does not revive the handled ones
    await journal.append({ account: "m1", amount: 50, kind: "earn", reference: "o3", at: day(6) });
    expect(
      await journal.reverseWhere({ account: "m1", kind: "earn", before: day(5) }, expire),
    ).toEqual([]);
    expect(await journal.balance({ account: "m1" })).toBe(50);
  });

  it("posts balanced lines together, or nothing", async () => {
    const entries = new MemoryEntries("memberId");
    const journal = journalOver(PointsEntry, entries);
    const issue = [
      { account: "issued", amount: -120, kind: "earn", reference: "o1", at: day(1), floor: null },
      { account: "m1", amount: 120, kind: "earn", reference: "o1", at: day(1) },
    ] as const;

    expect(await journal.post(issue)).toEqual({ written: true, belowFloor: false });
    expect(await journal.post(issue)).toEqual({ written: false, belowFloor: false });
    expect(await journal.balance({ account: "issued" })).toBe(-120);
    expect(await journal.balance({ account: "m1" })).toBe(120);

    // the member's account keeps the model's floor of zero
    expect(
      await journal.post([
        { account: "m1", amount: -200, kind: "redeem", reference: "r1", at: day(2) },
        { account: "redeemed", amount: 200, kind: "redeem", reference: "r1", at: day(2) },
      ]),
    ).toEqual({ written: false, belowFloor: true });
    expect(entries.rows).toHaveLength(2);
  });

  it("reads a posting's lines back by reference, on every account (STA-1240)", async () => {
    const entries = new MemoryEntries("memberId");
    const journal = journalOver(PointsEntry, entries);
    expect(await journal.lines("o1")).toEqual([]);
    await journal.post([
      { account: "m1", amount: 120, kind: "earn", reference: "o1", at: day(1) },
      { account: "issued", amount: -120, kind: "earn", reference: "o1", at: day(1), floor: null },
    ]);
    await journal.append({ account: "m1", amount: 5, kind: "earn", reference: "o2", at: day(2) });

    expect(await journal.lines("o1")).toEqual([
      { account: "issued", amount: -120, kind: "earn", reference: "o1", at: day(1) },
      { account: "m1", amount: 120, kind: "earn", reference: "o1", at: day(1) },
    ]);
  });

  it("refuses an unbalanced posting, a single line and a repeated pair before writing anything", async () => {
    const entries = new MemoryEntries("account");
    const journal = journalOver(CashEntry, entries);
    const unbalanced = await journal
      .post([line("a", -100), line("b", 90)])
      .catch((error: unknown) => error);
    expect(isRefusal(unbalanced, UnbalancedPostingError)).toBe(true);
    expect(unbalanced).toMatchObject({ lines: 2, total: -10 });
    await expect(journal.post([line("a", 0)])).rejects.toSatisfy((error: unknown) =>
      isRefusal(error, UnbalancedPostingError),
    );
    await expect(journal.post([line("a", -5), line("a", 5)])).rejects.toThrow(TypeError);
    expect(entries.rows).toEqual([]);
  });

  it("refuses an amount that is not a whole number of units", async () => {
    const journal = journalOver(CashEntry, new MemoryEntries("account"));

    await expect(
      journal.append({ account: "a1", amount: 1.5, kind: "earn", reference: "o1", at: day(1) }),
    ).rejects.toThrow(RangeError);
  });

  it("refuses a model without AppendOnly", async () => {
    const journal = journalOver(DraftEntry, new MemoryEntries("account"));

    await expect(journal.balance({ account: "a1" })).rejects.toThrow(/AppendOnly/);
  });

  it("types an entry's kind as the model's", () => {
    expectTypeOf<
      Parameters<Journal<PointsEntry>["append"]>[0]["kind"]
    >().toEqualTypeOf<PointsKind>();
    expectTypeOf<Parameters<Journal<CashEntry>["append"]>[0]["kind"]>().toEqualTypeOf<string>();
    expectTypeOf<
      NonNullable<Parameters<Journal<PointsEntry>["balance"]>[0]["amount"]>
    >().toEqualTypeOf<"points">();
  });
});

/** A money ledger row with a currency field and a floor of zero. */
@Journaled({
  currency: "currency",
  floor: 0,
})
class MoneyEntry extends Model.with(AppendOnly) {
  account!: string;

  amount!: number;

  kind!: string;

  reference!: string;

  at!: Date;

  currency!: string;
}

/** A money line on `account` in `currency`. */
const money = (account: string, amount: number, currency: string, reference = "t1") => ({
  account,
  amount,
  kind: "transfer",
  reference,
  at: day(1),
  currency,
});

describe("Journal with a currency field", () => {
  it("writes and reads the currency, and sums balances per currency", async () => {
    const entries = new MemoryEntries("account");
    const journal = journalOver(MoneyEntry, entries);
    await journal.append(money("a1", 100, "EUR", "o1"));
    await journal.append(money("a1", 70, "USD", "o2"));

    expect(entries.rows[0]).toMatchObject({ amount: 100, currency: "EUR" });
    expect(await journal.balance({ account: "a1", currency: "EUR" })).toBe(100);
    expect(await journal.balance({ account: "a1", currency: "USD" })).toBe(70);
    expect(await journal.find({ account: "a1", reference: "o2" })).toMatchObject({
      currency: "USD",
    });
  });

  it("keeps the floor per currency", async () => {
    const journal = journalOver(MoneyEntry, new MemoryEntries("account"));
    await journal.append(money("a1", 100, "EUR", "o1"));

    expect(await journal.append(money("a1", -50, "USD", "d1"))).toEqual({
      written: false,
      belowFloor: true,
    });
    expect(await journal.append(money("a1", -50, "EUR", "d2"))).toMatchObject({ written: true });
  });

  it("posts lines that share one currency and refuses a mixed posting", async () => {
    const entries = new MemoryEntries("account");
    const journal = journalOver(MoneyEntry, entries);

    expect(
      await journal.post([
        // the issuing account lifts the model's floor of zero, as a line of an issue does
        { ...money("issued", -5, "EUR"), floor: null },
        money("a1", 5, "EUR"),
      ]),
    ).toMatchObject({
      written: true,
    });
    const mixed = await journal
      .post([money("a", -5, "EUR", "m1"), money("b", 5, "USD", "m1")])
      .catch((error: unknown) => error);
    expect(isRefusal(mixed, UnbalancedPostingError)).toBe(true);
    expect(mixed).toMatchObject({ lines: 2, total: 0, currencies: ["EUR", "USD"] });
    expect(entries.rows).toHaveLength(2);
  });

  it("reverses each currency against its own balance", async () => {
    const journal = journalOver(MoneyEntry, new MemoryEntries("account"));
    await journal.append(money("a1", 40, "EUR", "o1"));
    await journal.append(money("a1", 90, "USD", "o2"));
    await journal.append({ ...money("a1", -30, "EUR", "d1"), kind: "redeem" });

    const reversed = await journal.reverseWhere(
      { account: "a1", kind: "transfer", before: day(2) },
      { kind: "expire", referencePrefix: "expire:", at: day(3) },
    );

    // 10 EUR are left above the floor, so the EUR earn is cut to 10; the USD earn is reversed in full
    expect(reversed.map((entry) => [entry.reference, entry.amount, entry.currency])).toEqual([
      ["o1", 10, "EUR"],
      ["o2", 90, "USD"],
    ]);
    expect(await journal.balance({ account: "a1", currency: "EUR" })).toBe(0);
    expect(await journal.balance({ account: "a1", currency: "USD" })).toBe(0);
  });

  it("refuses a missing or malformed currency, and a balance without one", async () => {
    const journal = journalOver(MoneyEntry, new MemoryEntries("account"));

    await expect(
      journal.append({ account: "a1", amount: 1, kind: "x", reference: "o1", at: day(1) }),
    ).rejects.toThrow(RangeError);
    await expect(journal.append(money("a1", 1, "eur", "o1"))).rejects.toThrow(RangeError);
    await expect(journal.balance({ account: "a1" })).rejects.toThrow(TypeError);
  });

  it("refuses a currency on a model that names no currency field", async () => {
    const journal = journalOver(CashEntry, new MemoryEntries("account"));

    await expect(journal.append(money("a1", 1, "EUR", "o1"))).rejects.toThrow(TypeError);
    await expect(journal.balance({ account: "a1", currency: "EUR" })).rejects.toThrow(TypeError);
  });
});
