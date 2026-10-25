/**
 * Stackra file contract:
 * Purpose: unit tests of `assertBalanced` and `postJournal`: balanced journals pass; one line, a zero line or a
 *          currency that does not balance are refused before any provider call; a key already posted returns its
 *          journal without posting again.
 * Boundary: test only; the provider is an in-memory stand-in.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; Juristra services-and-packages (balanced, idempotent journals).
 */
import { Money } from "@stackra/money";
import { describe, expect, it } from "@stackra/testing";

import type { AccountingProvider } from "#contracts/types/accounting-provider.type";
import type { JournalEntry } from "#contracts/types/journal-entry.type";
import { UnbalancedJournalError } from "#core/errors/unbalanced-journal.error";
import { assertBalanced } from "#core/functions/assert-balanced.function";
import { postJournal } from "#core/functions/post-journal.function";

const sar = (minor: number) => Money.ofMinor(minor, "SAR");
const entry = (lines: JournalEntry["lines"]): JournalEntry => ({
  date: new Date("2026-10-25"),
  narration: "Invoice 1",
  reference: "inv_1",
  lines,
});
const balanced = entry([
  { account: "1100", side: "debit", amount: sar(11_500) },
  { account: "4000", side: "credit", amount: sar(10_000) },
  { account: "2200", side: "credit", amount: sar(1_500) },
]);

/** Remembers posts by key. */
function provider(): AccountingProvider & { posts: number } {
  const byKey = new Map<string, { providerRef: string; status: "posted" }>();
  return {
    posts: 0,
    async post(_entry, key) {
      this.posts += 1;
      const journal = { providerRef: `mj_${this.posts}`, status: "posted" as const };
      byKey.set(key, journal);
      return journal;
    },
    async find(key) {
      return byKey.get(key) ?? null;
    },
    async accounts() {
      return [];
    },
  };
}

describe("journals", () => {
  it("accepts a balanced journal", () => {
    expect(() => assertBalanced(balanced)).not.toThrow();
  });

  it("refuses one line, a zero line and an unbalanced currency", () => {
    expect(() => assertBalanced(entry([{ account: "1", side: "debit", amount: sar(1) }]))).toThrow(
      UnbalancedJournalError,
    );
    expect(() =>
      assertBalanced(
        entry([
          { account: "1", side: "debit", amount: sar(0) },
          { account: "2", side: "credit", amount: sar(0) },
        ]),
      ),
    ).toThrow(UnbalancedJournalError);
    let refused: unknown;
    try {
      assertBalanced(
        entry([
          { account: "1", side: "debit", amount: sar(100) },
          { account: "2", side: "credit", amount: Money.ofMinor(100, "AED") },
        ]),
      );
    } catch (error) {
      refused = error;
    }
    expect(refused).toBeInstanceOf(UnbalancedJournalError);
    expect((refused as UnbalancedJournalError).details).toEqual({
      reference: "inv_1",
      currency: "SAR",
    });
  });

  it("posts once per key", async () => {
    const accounting = provider();
    const first = await postJournal(accounting, balanced, "invoice.issued:evt_1");
    const again = await postJournal(accounting, balanced, "invoice.issued:evt_1");
    expect(again).toEqual(first);
    expect(accounting.posts).toBe(1);
    await expect(postJournal(accounting, entry([]), "k")).rejects.toThrow(UnbalancedJournalError);
  });
});
