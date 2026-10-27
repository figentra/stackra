/**
 * Stackra file contract:
 * Purpose: unit tests of `signingKeySlots`: the newest key signs, every key gets a SCREAMING_SNAKE secret name.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0437 (decision 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { signingKeySlots } from "#core/functions/signing-key-slots.function";

describe("signingKeySlots", () => {
  it("signs with the newest and verifies with both", () => {
    expect(signingKeySlots(["k2026-10", "k2026-07"])).toEqual([
      { keyId: "k2026-10", secret: "STACKRA_EDGE_SIGNING_KEY_K2026_10", signs: true },
      { keyId: "k2026-07", secret: "STACKRA_EDGE_SIGNING_KEY_K2026_07", signs: false },
    ]);
  });
});
