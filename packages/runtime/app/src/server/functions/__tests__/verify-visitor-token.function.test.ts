/**
 * Stackra file contract:
 * Purpose: unit tests of `signVisitorToken` and `verifyVisitorToken`: a token signed with the current key verifies as
 *          key 0, one signed with the previous key as key 1, and a token signed with neither, tampered with, or
 *          malformed is refused.
 * Boundary: test only; Web Crypto in the test process.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; STA-2025 (as amended 2026-11-09).
 */
import type { PublicId } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { signVisitorToken } from "#server/functions/sign-visitor-token.function";
import { verifyVisitorToken } from "#server/functions/verify-visitor-token.function";

const ID = "anon_01j9z3k4m5n6p7q8r9s0t1v2a1" as PublicId;

describe("verifyVisitorToken", () => {
  it("names the visitor and the key that signed it, the current key first", async () => {
    expect(await verifyVisitorToken(await signVisitorToken(ID, "now"), ["now", "before"])).toEqual({
      id: ID,
      key: 0,
    });
    expect(
      await verifyVisitorToken(await signVisitorToken(ID, "before"), ["now", "before"]),
    ).toEqual({
      id: ID,
      key: 1,
    });
  });

  it("refuses a token no key signed, a changed id, a bad signature and a malformed token", async () => {
    const token = await signVisitorToken(ID, "now");
    const other = token.replace("a1.", "a2.");
    expect(
      await verifyVisitorToken(await signVisitorToken(ID, "stolen"), ["now", ""]),
    ).toBeUndefined();
    expect(await verifyVisitorToken(other, ["now"])).toBeUndefined();
    expect(await verifyVisitorToken(`${token.slice(0, -2)}AA`, ["now"])).toBeUndefined();
    expect(await verifyVisitorToken("v1.anon_x.y", ["now"])).toBeUndefined();
    expect(await verifyVisitorToken("", ["now"])).toBeUndefined();
  });
});
