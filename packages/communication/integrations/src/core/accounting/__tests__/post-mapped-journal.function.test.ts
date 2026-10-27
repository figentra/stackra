/**
 * Stackra file contract:
 * Purpose: unit tests of `postMappedJournal`: a journal in our keys is posted once in the Connection's codes; an
 *          unmapped key or an unbalanced journal posts nothing.
 * Boundary: test only; the Connection is an in-memory stand-in (core tests do not import `./testing`).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; STA-794 (balanced journals, idempotent, account mapping per Connection).
 */
import { Money } from "@stackra/money";
import { describe, expect, it } from "@stackra/testing";

import type {
  AccountMap,
  AccountMapped,
  AccountingProvider,
  JournalEntry,
  PostedJournal,
} from "#contracts/index";
import { postMappedJournal } from "#core/accounting/post-mapped-journal.function";
import { UnmappedAccountError } from "#core/accounting/unmapped-account.error";
import { UnbalancedJournalError } from "#core/errors/unbalanced-journal.error";

const sar = (minor: number) => Money.ofMinor(minor, "SAR");
const entry = (credit: number): JournalEntry => ({
  date: new Date("2026-10-27"),
  narration: "Invoice 1",
  reference: "inv_1",
  lines: [
    { account: "receivables", side: "debit", amount: sar(10_000) },
    { account: "sales", side: "credit", amount: sar(credit) },
  ],
});
/** Remembers posts by key and holds `accountMap`. */
function connector(
  accountMap: AccountMap = { accounts: { receivables: "1100", sales: "4000" } },
): AccountingProvider & AccountMapped & { posted: JournalEntry[] } {
  const byKey = new Map<string, PostedJournal>();
  return {
    posted: [],
    async post(posted, key) {
      this.posted.push(posted);
      const journal: PostedJournal = { providerRef: `mj_${this.posted.length}`, status: "posted" };
      byKey.set(key, journal);
      return journal;
    },
    async find(key) {
      return byKey.get(key) ?? null;
    },
    async accounts() {
      return [];
    },
    async accountMap() {
      return accountMap;
    },
  };
}

describe("postMappedJournal", () => {
  it("posts once, in the Connection's codes", async () => {
    const accounting = connector();
    const first = await postMappedJournal(accounting, entry(10_000), "invoice.issued:evt_1");
    const again = await postMappedJournal(accounting, entry(10_000), "invoice.issued:evt_1");
    expect(again).toEqual(first);
    expect(accounting.posted).toHaveLength(1);
    expect(accounting.posted[0]?.lines.map((line) => line.account)).toEqual(["1100", "4000"]);
  });

  it("posts nothing when a key is unmapped or the journal does not balance", async () => {
    const unmapped = connector({ accounts: { receivables: "1100" } });
    await expect(postMappedJournal(unmapped, entry(10_000), "k1")).rejects.toThrow(
      UnmappedAccountError,
    );
    const unbalanced = connector();
    await expect(postMappedJournal(unbalanced, entry(9_000), "k2")).rejects.toThrow(
      UnbalancedJournalError,
    );
    expect([...unmapped.posted, ...unbalanced.posted]).toHaveLength(0);
  });
});
