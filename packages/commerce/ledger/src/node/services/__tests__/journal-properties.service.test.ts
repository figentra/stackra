/**
 * Stackra file contract:
 * Purpose: property tests of `Journal` (ADR 0220 enforcement): any balanced posting is written and moves each account
 *          by exactly its lines; any unbalanced posting is refused and writes nothing, also where the amounts are so
 *          large that a floating-point sum would round the difference away; a balance is always the sum of the
 *          account's entries, a retried reference counting once; a floor of zero is never crossed, whatever the order
 *          of earns and debits; and reversing every entry brings the account back to zero, once.
 * Boundary: test only; the entries live in the memory journal of `journal-over.fixture.ts` and `memory-entries.fixture.ts`, and fast-check generates
 *           the postings. The two counterexamples it found (a balanced posting refused, an unbalanced one written, both
 *           from a floating-point sum) are kept as example tests.
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

/** A safe amount, often near the safe-integer limit, where a floating-point sum loses units. */
const amount = fc.oneof(
  fc.integer({ min: -1_000_000, max: 1_000_000 }),
  fc.maxSafeInteger(),
  fc.constantFrom(Number.MAX_SAFE_INTEGER, -Number.MAX_SAFE_INTEGER, 1, -1, 2, -2),
);

/** The exact sum of `amounts`. */
const exactSum = (amounts: readonly number[]): bigint =>
  amounts.reduce((sum, value) => sum + BigInt(value), 0n);

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
