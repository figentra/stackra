/**
 * Stackra file contract:
 * Purpose: unit tests of `credentialRef`: a reference is built and parsed back; a malformed one is refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; JUR-97.
 */
import { describe, expect, it } from "@stackra/testing";

import { credentialRef } from "#core/functions/credential-ref.function";

describe("credentialRef", () => {
  it("builds and parses", () => {
    const ref = credentialRef("najiz", "conn_01j9z3k4m5n6p7q8r9s0t1v2w3");
    expect(ref).toBe("najiz:conn_01j9z3k4m5n6p7q8r9s0t1v2w3");
    expect(credentialRef.parse(ref)).toEqual({
      provider: "najiz",
      connectionId: "conn_01j9z3k4m5n6p7q8r9s0t1v2w3",
    });
  });

  it.each(["najiz", "Najiz:conn_1", "najiz:usr_1", "najiz:conn_1:x"])("refuses %s", (ref) => {
    expect(() => credentialRef.parse(ref)).toThrow(TypeError);
  });
});
