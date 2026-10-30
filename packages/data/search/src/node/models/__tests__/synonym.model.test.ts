/**
 * Stackra file contract:
 * Purpose: unit tests of the `Synonym` model: it is a tenant-owned model with a `syn` public id and timestamps, and
 *          declares the index its migration writes.
 * Boundary: test only; no database runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0321 and 0323 (BelongsToTenant); ADR 0492 (decision 5).
 */
import { Index, Model, traitsOf } from "@stackra/model";
import { describe, expect, it } from "@stackra/testing";

import { Synonym } from "#node/models/synonym.model";

describe(Synonym, () => {
  it("is a tenant-owned model with the syn public id and timestamps", () => {
    const row = new Synonym();
    expect(row).toBeInstanceOf(Model);
    expect(traitsOf(Synonym).map((trait) => trait.name)).toEqual([
      "has_public_id",
      "belongs_to_tenant",
      "timestamps",
    ]);
    expect(row.id).toMatch(/^syn_/);
  });

  it("declares the index its migration writes", () => {
    expect(Index.on(Synonym)).toEqual([
      { properties: ["tenantId", "indexName", "language"], unique: false },
    ]);
  });
});
