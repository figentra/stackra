/**
 * Stackra file contract:
 * Purpose: unit tests of `runAccountingCase` over a sample driver of a made-up REST ledger: a driver that matches its
 *          recording passes and returns the journal; a driver that posts again instead of finding, returns another
 *          journal, reads a different chart or leaves a recorded call unmade fails with the case's name.
 * Boundary: test only. The sample driver names no vendor (ADR 0443 decision 8); real drivers and their recordings
 *           live with the OS integrations connectors.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decision 3); ADR 0443 (decision 8); owner D3 2026-10-27.
 */
import { Money } from "@stackra/money";
import { describe, expect, it } from "@stackra/testing";

import type { AccountingProvider, JournalEntry, PostedJournal } from "#contracts/index";
import type { IntegrationApi } from "#core/index";
import type { AccountingCase } from "#testing/accounting/accounting-case.type";
import { runAccountingCase } from "#testing/accounting/run-accounting-case.function";

/** A sample driver: finds by reference, posts with the idempotency key, reads the chart. */
class LedgerAccounting implements AccountingProvider {
  readonly api: IntegrationApi;

  /** When set, never finds, so a second post goes out. */
  readonly forgetful: boolean;

  constructor(api: IntegrationApi, forgetful = false) {
    this.api = api;
    this.forgetful = forgetful;
  }

  async post(entry: JournalEntry, idempotencyKey: string): Promise<PostedJournal> {
    const body = {
      date: entry.date.toISOString().slice(0, 10),
      memo: entry.narration,
      reference: idempotencyKey,
      lines: entry.lines.map((line) => ({
        account: line.account,
        [line.side]: line.amount.minor,
        currency: line.amount.currency,
      })),
    };
    const { id } = await this.api.post<{ id: string }>("/journals", body, { idempotencyKey });
    return { providerRef: id, status: "posted" };
  }

  async find(idempotencyKey: string): Promise<PostedJournal | null> {
    if (this.forgetful) return null;
    const { journals } = await this.api.get<{ journals: { id: string }[] }>("/journals", {
      query: { reference: idempotencyKey },
    });
    const found = journals[0];
    return found === undefined ? null : { providerRef: found.id, status: "posted" };
  }

  async accounts(): Promise<readonly { readonly code: string; readonly name: string }[]> {
    const { accounts } = await this.api.get<{ accounts: { code: string; name: string }[] }>(
      "/accounts",
    );
    return accounts;
  }
}

const entry: JournalEntry = {
  date: new Date("2026-10-27T00:00:00Z"),
  narration: "Invoice 1",
  reference: "inv_1",
  lines: [
    { account: "1100", side: "debit", amount: Money.ofMinor(10_000, "SAR") },
    { account: "4000", side: "credit", amount: Money.ofMinor(10_000, "SAR") },
  ],
};
const recorded: AccountingCase = {
  name: "invoice issued",
  certification: "pending",
  entry,
  idempotencyKey: "invoice.issued:evt_1",
  journal: { providerRef: "J-1", status: "posted" },
  accounts: [{ code: "1100", name: "Receivables" }],
  exchanges: [
    {
      method: "GET",
      path: "/journals",
      query: { reference: "invoice.issued:evt_1" },
      answer: { journals: [] },
    },
    {
      method: "POST",
      path: "/journals",
      idempotencyKey: "invoice.issued:evt_1",
      body: {
        date: "2026-10-27",
        memo: "Invoice 1",
        reference: "invoice.issued:evt_1",
        lines: [
          { account: "1100", debit: 10_000, currency: "SAR" },
          { account: "4000", credit: 10_000, currency: "SAR" },
        ],
      },
      answer: { id: "J-1" },
    },
    {
      method: "GET",
      path: "/journals",
      query: { reference: "invoice.issued:evt_1" },
      answer: { journals: [{ id: "J-1" }] },
    },
    {
      method: "GET",
      path: "/accounts",
      answer: { accounts: [{ code: "1100", name: "Receivables" }] },
    },
  ],
};

describe("runAccountingCase", () => {
  it("passes a driver that matches its recording", async () => {
    await expect(runAccountingCase((api) => new LedgerAccounting(api), recorded)).resolves.toEqual({
      providerRef: "J-1",
      status: "posted",
    });
  });

  it("fails a driver that posts again instead of finding", async () => {
    await expect(
      runAccountingCase((api) => new LedgerAccounting(api, true), recorded),
    ).rejects.toThrow(TypeError);
  });

  it("fails on another journal, another chart or a call left unmade", async () => {
    await expect(
      runAccountingCase((api) => new LedgerAccounting(api), {
        ...recorded,
        journal: { providerRef: "J-2", status: "posted" },
      }),
    ).rejects.toThrow(/"invoice issued": the posted journal differs/);
    await expect(
      runAccountingCase((api) => new LedgerAccounting(api), { ...recorded, accounts: [] }),
    ).rejects.toThrow(/the chart of accounts differs/);
    const { accounts: _accounts, ...withoutChart } = recorded;
    await expect(
      runAccountingCase((api) => new LedgerAccounting(api), withoutChart),
    ).rejects.toThrow(/was never made/);
  });
});
