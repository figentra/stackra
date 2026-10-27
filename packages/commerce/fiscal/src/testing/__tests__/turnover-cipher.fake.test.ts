/**
 * Stackra file contract:
 * Purpose: unit tests of `TurnoverCipherFake`: a readable base64 stand-in and a recorded call.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0266 (decision 2); ADR 0364.
 */
import { describe, expect, it } from "@stackra/testing";

import { TurnoverCipher } from "#contracts/ports/turnover-cipher.port";
import { TurnoverCipherFake } from "#testing/turnover-cipher.fake";

describe("TurnoverCipherFake", () => {
  it("encodes the inputs and records them", async () => {
    const cipher = new TurnoverCipherFake();
    expect(cipher).toBeInstanceOf(TurnoverCipher);
    expect(await cipher.encrypt("u", "R-1", 5)).toBe(btoa("u:R-1:5"));
    expect(cipher.inputs).toEqual([{ unitId: "u", receiptNumber: "R-1", turnoverMinor: 5 }]);
  });
});
