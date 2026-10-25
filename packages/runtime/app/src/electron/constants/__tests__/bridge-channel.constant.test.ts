/**
 * Stackra file contract:
 * Purpose: unit tests of `BRIDGE_CHANNEL`: the one channel name the generated preload invokes.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0251.
 */
import { describe, expect, it } from "@stackra/testing";

import { BRIDGE_CHANNEL } from "#electron/constants/bridge-channel.constant";

describe("BRIDGE_CHANNEL", () => {
  it("is the stackra bridge channel", () => {
    expect(BRIDGE_CHANNEL).toBe("stackra:bridge");
  });
});
