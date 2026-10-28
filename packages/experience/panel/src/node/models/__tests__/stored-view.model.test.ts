/**
 * Stackra file contract:
 * Purpose: unit tests of `StoredView`: a tenant-owned, versioned, timestamped model with the `view` public id and the
 *          two lookup indexes its migration writes.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0271 (decision 8).
 */
import { Index, Model, traitsOf } from "@stackra/model";
import { describe, expect, it } from "@stackra/testing";

import { StoredView } from "#node/models/stored-view.model";

describe("StoredView", () => {
  it("is a tenant-owned, versioned model with the view public id", () => {
    const row = new StoredView();
    expect(row).toBeInstanceOf(Model);
    expect(traitsOf(StoredView).map((trait) => trait.name)).toEqual([
      "has_public_id",
      "belongs_to_tenant",
      "versioned",
      "timestamps",
    ]);
    expect(row.id).toMatch(/^view_/);
    expect(row.version).toBe(1);
  });

  it("declares the indexes its migration writes", () => {
    expect(Index.on(StoredView)).toEqual([
      { properties: ["tenantId", "resource", "owner"], unique: false },
      { properties: ["tenantId", "resource", "sharing"], unique: false },
    ]);
  });
});
