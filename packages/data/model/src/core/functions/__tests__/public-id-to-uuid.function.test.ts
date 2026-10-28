/**
 * Stackra file contract:
 * Purpose: unit tests of the public-id codec: `publicIdToUuid` and `uuidToPublicId` are inverses on minted ids, the
 *          stored form is a hyphenated UUIDv7 that keeps minting order, and malformed input is refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0135 (2026-10-28 amendment).
 */
import { mintPublicId } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { publicIdToUuid } from "#core/functions/public-id-to-uuid.function";
import { uuidToPublicId } from "#core/functions/uuid-to-public-id.function";

describe("public-id codec", () => {
  it("round-trips a minted id through its UUIDv7", () => {
    const id = mintPublicId("ord");
    const uuid = publicIdToUuid(id);
    expect(uuid).toMatch(/^[\da-f]{8}-[\da-f]{4}-7[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/);
    expect(uuidToPublicId("ord", uuid)).toBe(id);
    expect(uuidToPublicId("ord", uuid.toUpperCase().replaceAll("-", ""))).toBe(id);
  });

  it("keeps minting order in the stored form", () => {
    const first = mintPublicId("ord", 1_700_000_000_000);
    const second = mintPublicId("ord", 1_700_000_000_001);
    expect(publicIdToUuid(first) < publicIdToUuid(second)).toBe(true);
  });

  it("refuses what is not a public id or a UUID", () => {
    expect(() => publicIdToUuid("ord-123")).toThrow(TypeError);
    expect(() => publicIdToUuid(`ord_${"z".repeat(26)}`)).toThrow("does not encode a UUID");
    expect(() => uuidToPublicId("ord", "not-a-uuid")).toThrow(TypeError);
  });
});
