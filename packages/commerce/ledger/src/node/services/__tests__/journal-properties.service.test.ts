/**
 * Stackra file contract:
 * Purpose: property tests of `Journal` (ADR 0220 enforcement): any balanced posting is written and moves each account
 *          by exactly its lines; any unbalanced posting is refused and writes nothing, also where the amounts are so
 *          large that a floating-point sum would round the difference away; a balance is always the sum of the
 *          account's entries, a retried reference counting once; a floor of zero is never crossed, whatever the order
 *          of earns and debits; and reversing every entry brings the account back to zero, once. Floors are checked
 *          exactly: a posting is refused exactly when an account's exact net would take it below its floor, and a
 *          reversal is cut exactly where the exact running balance meets the floor, also beside the safe-integer limit;
 *          a floored write against a balance beyond that limit is refused with a RangeError and writes nothing.
 * Boundary: test only; the entries live in the memory journal of `journal-over.fixture.ts` and
 *           `memory-entries.fixture.ts`, and fast-check generates the postings. The counterexamples of a floating-point
 *           sum (a balanced posting refused, an unbalanced one written, a floor crossed by a unit, a reversal cut short)
 *           are kept as example tests.
 * Runtime: node (vitest)
 * Governing contract: ADR 0220 (decision 4 and the enforcement line); ADR 0182 (unit tier); ADR 0022; ADR 0269.
 */
import { isRefusal } from "@stackra/errors";
import { AppendOnly, Model } from "@stackra/model";
import { describe, expect, it } from "@stackra/testing";
import * as fc from "fast-check";

import { Journaled } from "#core/decorators/journaled.decorator";
import { UnbalancedPostingError } from "#core/errors/unbalanced-posting.error";

import { journalOver } from "./journal-over.fixture";
import { MemoryEntries } from "./memory-entries.fixture";

/** A ledger row under the journal's own field names, with no floor. */
class LedgerEntry extends Model.with(AppendOnly) {
  account!: string;

  amount!: number;

  kind!: string;

  reference!: string;

  at!: Date;
}

/** A wallet row with a floor of zero. */
@Journaled({ floor: 0 })
class WalletEntry extends Model.with(AppendOnly) {
  account!: string;

  amount!: number;

  kind!: string;

  reference!: string;

  at!: Date;
}

/** When every generated entry is written. */
const AT = new Date(Date.UTC(2026, 0, 1));

/** A posting line on `account` under `reference`, with no floor. */
const lineOf = (account: string, amount: number, reference = "p1") => ({
  account,
  amount,
  kind: "transfer",
  reference,
  at: AT,
  floor: null,
});

/** A posting line on `account` under `reference` that keeps the model's default floor. */
const modelLine = (account: string, amount: number, reference: string) => ({
  account,
  amount,
  kind: "transfer",
  reference,
  at: AT,
});

/** A safe amount, often near the safe-integer limit, where a floating-point sum loses units. */
const amount = fc.oneof(
  fc.integer({ min: -1_000_000, max: 1_000_000 }),
  fc.maxSafeInteger(),
  fc.constantFrom(Number.MAX_SAFE_INTEGER, -Number.MAX_SAFE_INTEGER, 1, -1, 2, -2),
);

/** The exact sum of `amounts`. */
const exactSum = (amounts: readonly number[]): bigint =>
  amounts.reduce((sum, value) => sum + BigInt(value), 0n);

/** The exact balance of `account` in `entries`: the sum of its rows, in BigInt. */
const exactBalance = (entries: MemoryEntries, account: string): bigint =>
  entries.rows
    .filter((row) => row["account"] === account)
    .reduce((sum, row) => sum + BigInt(Number(row["amount"])), 0n);

/** Whether `value` is a safe integer. */
const isSafe = (value: bigint): boolean =>
  value <= BigInt(Number.MAX_SAFE_INTEGER) && value >= -BigInt(Number.MAX_SAFE_INTEGER);

/** One to seven amounts and the closing amount that balances them, on accounts a0, a1, ... */
const balanced = fc
  .array(amount, { minLength: 1, maxLength: 7 })
  .filter((amounts) => isSafe(-exactSum(amounts)))
  .map((amounts) => [...amounts, Number(-exactSum(amounts))]);

describe("Journal.post (properties)", () => {
  it("writes any balanced posting and moves each account by exactly its line", async () => {
    await fc.assert(
      fc.asyncProperty(balanced, async (amounts) => {
        const journal = journalOver(LedgerEntry, new MemoryEntries("account"));
        const lines = amounts.map((value, index) => lineOf(`a${index}`, value));

        expect(await journal.post(lines)).toEqual({ written: true, belowFloor: false });
        for (const line of lines)
          expect(await journal.balance({ account: line.account })).toBe(line.amount);
        expect(await journal.lines("p1")).toHaveLength(lines.length);
        expect(await journal.post(lines)).toEqual({ written: false, belowFloor: false });
      }),
    );
  });

  it("refuses any unbalanced posting and writes nothing", async () => {
    await fc.assert(
      fc.asyncProperty(
        balanced,
        fc
          .oneof(fc.constantFrom(1, -1, 2, -2), fc.integer({ min: -1000, max: 1000 }))
          .filter((delta) => delta !== 0),
        fc.nat(),
        async (amounts, delta, pick) => {
          // move one line by `delta`, keeping it a safe integer, so the posting is off by exactly `delta`
          const index = pick % amounts.length;
          const moved = BigInt(amounts[index] ?? 0) + BigInt(delta);
          fc.pre(isSafe(moved));
          const unbalanced = amounts.map((value, at) => (at === index ? Number(moved) : value));
          const entries = new MemoryEntries("account");
          const journal = journalOver(LedgerEntry, entries);

          const refusal = await journal
            .post(unbalanced.map((value, at) => lineOf(`a${at}`, value)))
            .catch((error: unknown) => error);
          expect(isRefusal(refusal, UnbalancedPostingError)).toBe(true);
          expect(entries.rows).toEqual([]);
        },
      ),
    );
  });

  it("writes a balanced posting beside amounts at the safe-integer limit (fast-check counterexample)", async () => {
    // -1 - MAX is -2^53, and -2^53 - 312951 is not a double, so a floating-point sum missed zero by one unit
    const journal = journalOver(LedgerEntry, new MemoryEntries("account"));
    const lines = [-1, -Number.MAX_SAFE_INTEGER, -312_951, Number.MAX_SAFE_INTEGER, 312_952].map(
      (value, index) => lineOf(`a${index}`, value),
    );

    expect(await journal.post(lines)).toEqual({ written: true, belowFloor: false });
  });

  it("refuses a posting off by one unit beside amounts at the safe-integer limit (fast-check counterexample)", async () => {
    // MAX + 2 is not a double, so a floating-point sum lands on MAX + 1 and the posting looked balanced
    const entries = new MemoryEntries("account");
    const journal = journalOver(LedgerEntry, entries);
    const refusal = await journal
      .post([
        lineOf("a0", Number.MAX_SAFE_INTEGER),
        lineOf("a1", 2),
        lineOf("a2", -Number.MAX_SAFE_INTEGER),
        lineOf("a3", -1),
      ])
      .catch((error: unknown) => error);

    expect(isRefusal(refusal, UnbalancedPostingError)).toBe(true);
    expect(refusal).toMatchObject({ lines: 4, total: 1 });
    expect(entries.rows).toEqual([]);
  });
});

describe("Journal balances (properties)", () => {
  /** Up to 30 appends on three accounts, references drawn from a small set so some are retries. */
  const appends = fc.array(
    fc.record({
      account: fc.constantFrom("a", "b", "c"),
      amount: fc.integer({ min: -10_000, max: 10_000 }),
      reference: fc.constantFrom("r0", "r1", "r2", "r3", "r4", "r5", "r6", "r7"),
    }),
    { maxLength: 30 },
  );

  it("is the sum of the account's entries, a retried reference counting once", async () => {
    await fc.assert(
      fc.asyncProperty(appends, async (writes) => {
        const journal = journalOver(LedgerEntry, new MemoryEntries("account"));
        const applied = new Map<string, number>();
        for (const write of writes) {
          const key = `${write.account}/${write.reference}`;
          const result = await journal.append({ ...write, kind: "move", at: AT });
          expect(result.written).toBe(!applied.has(key));
          if (!applied.has(key)) applied.set(key, write.amount);
        }
        for (const account of ["a", "b", "c"]) {
          const expected = [...applied]
            .filter(([key]) => key.startsWith(`${account}/`))
            .reduce((sum, [, value]) => sum + value, 0);
          expect(await journal.balance({ account })).toBe(expected);
        }
      }),
    );
  });

  it("never lets a floor of zero be crossed, and refuses a debit exactly when it would cross it", async () => {
    await fc.assert(
      fc.asyncProperty(appends, async (writes) => {
        const journal = journalOver(WalletEntry, new MemoryEntries("account"));
        const model = new Map<string, number>();
        for (const [index, write] of writes.entries()) {
          const before = model.get(write.account) ?? 0;
          const result = await journal.append({
            ...write,
            reference: `w${index}`,
            kind: "move",
            at: AT,
          });
          const refused = write.amount < 0 && before + write.amount < 0;
          expect(result).toEqual({ written: !refused, belowFloor: refused });
          if (!refused) model.set(write.account, before + write.amount);
          expect(await journal.balance({ account: write.account })).toBeGreaterThanOrEqual(0);
        }
      }),
    );
  });

  it("returns an account to zero when every entry is reversed, and a second reversal changes nothing", async () => {
    await fc.assert(
      fc.asyncProperty(appends, async (writes) => {
        const journal = journalOver(LedgerEntry, new MemoryEntries("account"));
        for (const [index, write] of writes.entries())
          await journal.append({
            ...write,
            account: "a",
            reference: `w${index}`,
            kind: "move",
            at: AT,
          });
        const reversal = { kind: "reverse", referencePrefix: "rev:", at: AT };

        expect(await journal.reverseWhere({ account: "a" }, reversal)).toHaveLength(writes.length);
        expect(await journal.balance({ account: "a" })).toBe(0);
        expect(await journal.reverseWhere({ account: "a" }, reversal)).toEqual([]);
        expect(await journal.balance({ account: "a" })).toBe(0);
      }),
    );
  });
});

describe("Journal floors beside the safe-integer limit (properties)", () => {
  /** A debit, often at the limit. */
  const debit = fc.oneof(
    fc.integer({ min: -1_000_000, max: -1 }),
    fc.integer({ min: -Number.MAX_SAFE_INTEGER, max: -1 }),
    fc.constantFrom(-Number.MAX_SAFE_INTEGER, -1, -2),
  );

  /** A floor near zero, an overdraft limit below it or a minimum above it. */
  const floor = fc.integer({ min: -3, max: 3 });

  it("refuses a posting exactly when an account's exact net takes it below its floor", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(debit, { minLength: 1, maxLength: 3 }),
        floor,
        fc.integer({ min: -2, max: 2 }),
        async (debits, limit, miss) => {
          // the account starts where the debits leave it `miss` units from its floor: below it exactly when `miss` < 0;
          // a balance is read as a number, so the start stays a safe integer (beyond it the write throws, tested below)
          const start = -exactSum(debits) + BigInt(limit) + BigInt(miss);
          fc.pre(start >= 0n && isSafe(start));
          const entries = new MemoryEntries("account");
          const journal = journalOver(LedgerEntry, entries);
          if (start > 0n)
            await journal.append({
              account: "a",
              amount: Number(start),
              kind: "seed",
              reference: "s",
              at: AT,
            });
          // one debit of "a" and its matching credit of "b" per reference, so every line is a safe integer
          const lines = debits.flatMap((value, index) => [
            { ...lineOf("a", value, `p${index}`), floor: limit },
            lineOf("b", -value, `p${index}`),
          ]);
          const below = miss < 0;

          expect(await journal.post(lines)).toEqual({ written: !below, belowFloor: below });
          expect(exactBalance(entries, "a")).toBe(below ? start : start + exactSum(debits));
        },
      ),
    );
  });

  it("cuts a reversal exactly where the exact running balance meets the floor", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc
          .array(amount, { minLength: 1, maxLength: 6 })
          // the balance read is a number, so the reversal starts from a safe integer (beyond it, it throws)
          .filter((amounts) => isSafe(exactSum(amounts))),
        floor,
        async (amounts, limit) => {
          const entries = new MemoryEntries("account");
          const journal = journalOver(LedgerEntry, entries);
          for (const [index, value] of amounts.entries())
            await journal.append({
              account: "a",
              amount: value,
              kind: "move",
              reference: `w${index}`,
              at: AT,
            });
          let balance = exactSum(amounts);
          const expected = amounts.map((value) => {
            const full = BigInt(-value);
            const room = BigInt(limit) - balance;
            const cut = full >= 0n ? full : room > 0n ? 0n : full > room ? full : room;
            balance += cut;
            return Number(-cut) || 0;
          });

          const reversed = await journal.reverseWhere(
            { account: "a" },
            { kind: "reverse", referencePrefix: "rev:", at: AT, floor: limit },
          );
          expect(reversed.map((entry) => entry.amount)).toEqual(expected);
          expect(exactBalance(entries, "a")).toBe(balance);
        },
      ),
    );
  });

  it("refuses two debits that cross an overdraft of one unit beside the limit (counterexample)", async () => {
    // -MAX - 2 is -(2^53 + 1), not a double: a number net rounded it to -2^53, so MAX - 2^53 = -1 met the floor of -1
    // although the exact balance after the posting is -2
    const entries = new MemoryEntries("account");
    const journal = journalOver(LedgerEntry, entries);
    await journal.append({
      account: "a",
      amount: Number.MAX_SAFE_INTEGER,
      kind: "seed",
      reference: "s1",
      at: AT,
    });

    const result = await journal.post([
      { ...modelLine("a", -Number.MAX_SAFE_INTEGER, "p1"), floor: -1 },
      { ...modelLine("a", -2, "p2"), floor: -1 },
      modelLine("b", Number.MAX_SAFE_INTEGER, "p1"),
      modelLine("b", 2, "p2"),
    ]);

    expect(result).toEqual({ written: false, belowFloor: true });
    expect(exactBalance(entries, "a")).toBe(BigInt(Number.MAX_SAFE_INTEGER));
  });

  it("reverses every entry in full when the running balance passes 2^53 (counterexample)", async () => {
    // the balance starts at 2; reversing the debit takes it to 2^53 + 1, not a double: a number running balance
    // rounded it to 2^53, came out one unit short and cut the last reversal to nothing
    const entries = new MemoryEntries("account");
    const journal = journalOver(WalletEntry, entries);
    for (const [reference, value] of [
      ["a1", -Number.MAX_SAFE_INTEGER],
      ["a2", 1],
      ["a3", Number.MAX_SAFE_INTEGER],
      ["a4", 1],
    ] as const)
      // oxlint-disable-next-line no-await-in-loop -- the entries are written in order
      await journal.append(
        { account: "a", amount: value, kind: "move", reference, at: AT },
        { floor: null },
      );

    const reversed = await journal.reverseWhere(
      { account: "a" },
      { kind: "reverse", referencePrefix: "rev:", at: AT },
    );

    expect(reversed.map((entry) => entry.amount)).toEqual([
      -Number.MAX_SAFE_INTEGER,
      1,
      Number.MAX_SAFE_INTEGER,
      1,
    ]);
    expect(exactBalance(entries, "a")).toBe(0n);
  });

  it("refuses a floored write against a balance beyond the safe-integer limit and writes nothing", async () => {
    await fc.assert(
      fc.asyncProperty(
        // a balance of MAX + over: a number may already have rounded it, so no floor is checked against it
        fc.integer({ min: 1, max: Number.MAX_SAFE_INTEGER }),
        fc.boolean(),
        async (over, negative) => {
          const sign = negative ? -1 : 1;
          const entries = new MemoryEntries("account");
          const journal = journalOver(LedgerEntry, entries);
          for (const [reference, value] of [
            ["s1", sign * Number.MAX_SAFE_INTEGER],
            ["s2", sign * over],
          ] as const)
            // oxlint-disable-next-line no-await-in-loop -- the seed is written in order
            await journal.append(
              { account: "a", amount: value, kind: "seed", reference, at: AT },
              { floor: null },
            );
          const before = [...entries.rows];

          const debitWrite = await journal
            .append(
              { account: "a", amount: -1, kind: "move", reference: "d", at: AT },
              { floor: 0 },
            )
            .catch((error: unknown) => error);
          const posting = await journal
            .post([{ ...lineOf("a", -1), floor: 0 }, lineOf("b", 1)])
            .catch((error: unknown) => error);
          const reversal = await journal
            .reverseWhere(
              { account: "a" },
              { kind: "reverse", referencePrefix: "rev:", at: AT, floor: 0 },
            )
            .catch((error: unknown) => error);

          expect(debitWrite).toBeInstanceOf(RangeError);
          expect(posting).toBeInstanceOf(RangeError);
          expect(reversal).toBeInstanceOf(RangeError);
          expect(entries.rows).toEqual(before);
        },
      ),
    );
  });

  it("refuses a floor that is not a safe integer before writing anything", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.double({ noInteger: true, noNaN: true, noDefaultInfinity: true }),
          fc.constantFrom(Number.NaN, Infinity, -Infinity, 2 ** 53, -(2 ** 53)),
        ),
        async (bad) => {
          const entries = new MemoryEntries("account");
          const journal = journalOver(LedgerEntry, entries);
          const debitWrite = await journal
            .append(
              { account: "a", amount: -1, kind: "move", reference: "d", at: AT },
              { floor: bad },
            )
            .catch((error: unknown) => error);
          const posting = await journal
            .post([{ ...lineOf("a", -1), floor: bad }, lineOf("b", 1)])
            .catch((error: unknown) => error);
          const reversal = await journal
            .reverseWhere(
              { account: "a" },
              { kind: "reverse", referencePrefix: "rev:", at: AT, floor: bad },
            )
            .catch((error: unknown) => error);

          expect(debitWrite).toBeInstanceOf(RangeError);
          expect(posting).toBeInstanceOf(RangeError);
          expect(reversal).toBeInstanceOf(RangeError);
          expect(entries.rows).toEqual([]);
        },
      ),
    );
  });
});
