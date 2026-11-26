/**
 * Stackra file contract:
 * Purpose: unit tests of `newPairingSecret`: 64 hex characters (256 bits), never the same twice.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0361 (decision 7).
 */
import { describe, expect, it } from "@stackra/testing";

import { newPairingSecret } from "#core/functions/new-pairing-secret.function";

describe("newPairingSecret", () => {
  it("draws 32 random bytes as hex", () => {
    const secrets = Array.from({ length: 50 }, () => newPairingSecret());
    for (const secret of secrets) expect(secret).toMatch(/^[0-9a-f]{64}$/);
    expect(new Set(secrets).size).toBe(50);
  });
});
