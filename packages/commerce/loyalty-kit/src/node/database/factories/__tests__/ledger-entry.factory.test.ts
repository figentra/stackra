/**
 * Stackra file contract:
 * Purpose: unit tests of `LedgerEntryFactory`: an unsaved 100-point earn with fresh member and order ids, and overrides
 *          that win.
 * Boundary: test only; `make` builds without a database. The factory is bound to its model as gen binds it.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0190.
 */
import { registerModelPartners } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { EntryKind } from "#contracts/enums/entry-kind.enum";
import { LedgerEntryFactory } from "#node/database/factories/ledger-entry.factory";
import { LedgerEntry } from "#node/models/ledger-entry.model";

registerModelPartners([[LedgerEntryFactory, LedgerEntry]]);

describe("LedgerEntryFactory", () => {
  it("builds a 100-point earn", () => {
    const entry = LedgerEntryFactory.new().make();
    expect(entry).toBeInstanceOf(LedgerEntry);
    expect(entry.points).toBe(100);
    expect(entry.kind).toBe(EntryKind.Earn);
    expect(entry.memberId).toMatch(/^usr_/);
    expect(entry.reference).toMatch(/^ord_/);
  });

  it("lets overrides win", () => {
    expect(LedgerEntryFactory.new().make({ points: -40, kind: EntryKind.Redeem })).toMatchObject({
      points: -40,
      kind: EntryKind.Redeem,
    });
  });
});
