/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryAccountingConnector`: a balanced journal posts once per key and is found by it; drafts
 *          are drafts; an unbalanced journal or an account outside the chart is refused; the chart and the mapping are
 *          what it was given.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0266 (decision 2); ADR 0269 (decision 3); STA-794.
 */
import { Money } from "@stackra/money";
import { describe, expect, it } from "@stackra/testing";

import type { AccountingJournalEntry } from "#contracts/index";
import { ProviderRefusedError, UnbalancedJournalError } from "#core/index";
import { MemoryAccountingConnector } from "#testing/accounting/memory-accounting.connector";

const chart = [
  { code: "1100", name: "Receivables" },
  { code: "4000", name: "Sales" },
];
const entry = (credit: string, minor = 10_000): AccountingJournalEntry => ({
  date: new Date("2026-10-27"),
  narration: "Invoice 1",
  reference: "inv_1",
  lines: [
    { account: "1100", side: "debit", amount: Money.ofMinor(10_000, "SAR") },
    { account: credit, side: "credit", amount: Money.ofMinor(minor, "SAR") },
  ],
});

describe("MemoryAccountingConnector", () => {
  it("posts once per key and finds it", async () => {
    const accounting = new MemoryAccountingConnector({ chart });
    expect(await accounting.find("k1")).toBeNull();
    const journal = await accounting.post(entry("4000"), "k1");
    expect(journal).toEqual({ providerRef: "mj_1", status: "posted" });
    expect(await accounting.post(entry("4000"), "k1")).toBe(journal);
    expect(await accounting.find("k1")).toBe(journal);
    expect(accounting.posted).toHaveLength(1);
  });

  it("holds drafts when told to", async () => {
    const accounting = new MemoryAccountingConnector({ drafts: true });
    expect((await accounting.post(entry("4000"), "k1")).status).toBe("draft");
  });

  it("refuses an unbalanced journal and an account outside the chart", async () => {
    const accounting = new MemoryAccountingConnector({ chart });
    await expect(accounting.post(entry("4000", 9000), "k1")).rejects.toThrow(
      UnbalancedJournalError,
    );
    const refused = await accounting.post(entry("9999"), "k2").catch((error: unknown) => error);
    expect(refused).toBeInstanceOf(ProviderRefusedError);
    expect((refused as ProviderRefusedError).providerCode).toBe("unknown_account");
    expect(accounting.posted).toHaveLength(0);
  });

  it("returns its chart and mapping", async () => {
    const accountMap = { accounts: { sales: "4000" } };
    const accounting = new MemoryAccountingConnector({ chart, accountMap });
    expect(await accounting.accounts()).toBe(chart);
    expect(await accounting.accountMap()).toBe(accountMap);
    expect(await new MemoryAccountingConnector().accountMap()).toEqual({ accounts: {} });
  });
});
