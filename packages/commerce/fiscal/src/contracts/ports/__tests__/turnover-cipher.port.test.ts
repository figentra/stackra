/**
 * Stackra file contract:
 * Purpose: unit tests of `TurnoverCipher`: an abstract port a host implements; `encrypt` returns base64 text.
 * Boundary: test only; a minimal host driver stands in.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0260 (decision 9); ADR 0364.
 */
import { Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { TurnoverCipher } from "#contracts/ports/turnover-cipher.port";

/** A host cipher stand-in. */
class Plain extends TurnoverCipher {
  async encrypt(_unitId: string, _receiptNumber: string, turnoverMinor: number): Promise<string> {
    return btoa(String(turnoverMinor));
  }
}

describe("TurnoverCipher", () => {
  it("is a port that encrypts a counter", async () => {
    const cipher = new Plain();
    expect(cipher).toBeInstanceOf(Port);
    expect(await cipher.encrypt("u", "R-1", 5)).toBe(btoa("5"));
  });
});
