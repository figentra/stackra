/**
 * Stackra file contract:
 * Purpose: unit tests of `versionInForce`: the approved version with the latest date at or before the term start wins,
 *          the higher number breaks a tie, and pending, rejected and future versions never count.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0391 (decision 3); owner OS-82.
 */
import { describe, expect, it } from "@stackra/testing";

import { CatalogueVersionState } from "#contracts/enums/catalogue-version-state.enum";
import type { CatalogueVersion } from "#contracts/types/catalogue-version.type";
import { versionInForce } from "#core/functions/version-in-force.function";

/** A version of `price-list:commerce`. */
function version(
  number: number,
  from: string,
  state: CatalogueVersionState = CatalogueVersionState.Approved,
): CatalogueVersion {
  return {
    key: "price-list:commerce",
    kind: "price-list",
    version: number,
    rows: [],
    effectiveFrom: new Date(from),
    discount: false,
    state,
    proposedBy: "usr_rana",
    proposedAt: new Date("2026-10-01T00:00:00Z"),
  };
}

describe("versionInForce", () => {
  const versions = [
    version(1, "2026-10-01T00:00:00Z"),
    version(2, "2026-12-01T00:00:00Z"),
    version(3, "2026-12-01T00:00:00Z"),
    version(4, "2026-11-01T00:00:00Z", CatalogueVersionState.Pending),
    version(5, "2026-11-01T00:00:00Z", CatalogueVersionState.Rejected),
  ];

  it("takes the latest approved version dated at or before the term start", () => {
    expect(versionInForce(versions, new Date("2026-11-15T00:00:00Z"))?.version).toBe(1);
    expect(versionInForce(versions, new Date("2026-12-01T00:00:00Z"))?.version).toBe(3);
  });

  it("is undefined before the first version", () => {
    expect(versionInForce(versions, new Date("2026-09-01T00:00:00Z"))).toBeUndefined();
  });
});
