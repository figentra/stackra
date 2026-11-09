/**
 * Stackra file contract:
 * Purpose: unit tests of `isPublicId`: a minted id passes in either case; another prefix, a wrong length, a character
 *          outside Crockford base32, a non-string and an invalid prefix fail.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0135.
 */
import { describe, expect, it } from "@stackra/testing";

import { isPublicId } from "#core/functions/is-public-id.function";
import { mintPublicId } from "#core/functions/mint-public-id.function";

describe(isPublicId, () => {
  it("passes a minted id, in either case", () => {
    const id = mintPublicId("scp");
    expect(isPublicId(id, "scp")).toBe(true);
    expect(isPublicId(id.toUpperCase().replace("SCP_", "scp_"), "scp")).toBe(true);
  });

  it("refuses another prefix, a wrong length, a character outside Crockford base32 and a non-string", () => {
    expect(isPublicId(mintPublicId("ord"), "scp")).toBe(false);
    expect(isPublicId("scp_01j9z3k4m5n6p7q8r9s0t1v2w", "scp")).toBe(false);
    expect(isPublicId("scp_01j9z3k4m5n6p7q8r9s0t1v2wau", "scp")).toBe(false);
    expect(isPublicId("scp_01j9z3k4m5n6p7q8r9s0t1v2wu", "scp")).toBe(false);
    expect(isPublicId("scope-1", "scp")).toBe(false);
    expect(isPublicId(42, "scp")).toBe(false);
  });

  it("refuses everything for a prefix that is not 2 to 6 lowercase letters", () => {
    expect(isPublicId("s_01j9z3k4m5n6p7q8r9s0t1v2wa", "s")).toBe(false);
  });
});
