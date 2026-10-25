/**
 * Stackra file contract:
 * Purpose: unit tests of `LedgerEntry`: a scope-owned, append-only model with the `lpe` public id, the journal's entry
 *          model (account `memberId`, amount `points`, floor zero), with the idempotency index its migration writes.
 * Boundary: test only; reads the recorded metadata, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0220 (decisions 4 and 5); ADR 0294 (decision 27).
 */
import { Journaled } from "@stackra/ledger";
import { Index, Model, traitsOf } from "@stackra/model";
import { describe, expect, it } from "@stackra/testing";

import { LedgerEntry } from "#node/models/ledger-entry.model";

describe("LedgerEntry", () => {
  it("is a scope-owned, append-only model with the lpe public id and no account yet", () => {
    const entry = new LedgerEntry();
    expect(entry).toBeInstanceOf(Model);
    expect(traitsOf(LedgerEntry).map((trait) => trait.name)).toEqual([
      "has_public_id",
      "belongs_to_tenant",
      "append_only",
    ]);
    expect(entry.id).toMatch(/^lpe_[0-9a-z]{26}$/);
    expect(entry.account).toBeNull();
  });

  it("is the journal's entry model, floored at zero", () => {
    expect(Journaled.on(LedgerEntry)).toEqual({ account: "memberId", amount: "points", floor: 0 });
  });

  it("keeps one entry per scope, member and reference", () => {
    expect(Index.on(LedgerEntry)).toEqual([
      { properties: ["tenantId", "memberId", "reference"], unique: true },
    ]);
  });
});
