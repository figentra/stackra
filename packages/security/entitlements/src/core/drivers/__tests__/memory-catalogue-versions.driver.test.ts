/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryCatalogueVersionsDriver`: it starts empty, lists a record's versions lowest first, and
 *          a save with the same number replaces the stored version.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0391 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { CatalogueVersionState } from "#contracts/enums/catalogue-version-state.enum";
import type { CatalogueVersion } from "#contracts/types/catalogue-version.type";
import { MemoryCatalogueVersionsDriver } from "#core/drivers/memory-catalogue-versions.driver";

const BASE: CatalogueVersion = {
  key: "offer:founding",
  kind: "offer",
  version: 1,
  rows: [],
  effectiveFrom: new Date("2026-11-01T00:00:00Z"),
  discount: true,
  state: CatalogueVersionState.Pending,
  proposedBy: "usr_rana",
  proposedAt: new Date("2026-10-26T00:00:00Z"),
};

describe("MemoryCatalogueVersionsDriver", () => {
  it("lists versions lowest first and replaces by number", async () => {
    const store = new MemoryCatalogueVersionsDriver();
    expect(await store.list("offer:founding")).toEqual([]);
    await store.save({ ...BASE, version: 2 });
    await store.save(BASE);
    await store.save({ ...BASE, state: CatalogueVersionState.Approved });
    const versions = await store.list("offer:founding");
    expect(versions.map((held) => [held.version, held.state])).toEqual([
      [1, "approved"],
      [2, "pending"],
    ]);
  });
});
