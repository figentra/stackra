/**
 * Stackra file contract:
 * Purpose: unit tests of `newPairingCode`: eight characters from the unambiguous alphabet, different each time.
 * Boundary: test only; the platform's random source.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0361 (decision 7).
 */
import { describe, expect, it } from "@stackra/testing";

import { newPairingCode } from "#core/functions/new-pairing-code.function";

describe("newPairingCode", () => {
  it("draws eight unambiguous characters", () => {
    const codes = Array.from({ length: 50 }, () => newPairingCode());
    for (const code of codes) expect(code).toMatch(/^[A-HJKMNP-Z2-9]{8}$/);
    expect(new Set(codes).size).toBe(50);
  });
});
