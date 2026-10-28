/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./native` entry: the two drivers the generated native wiring imports, and
 *          nothing else.
 * Boundary: test only; imports the stand-in barrel with no Expo modules registry present, so an eager native lookup
 *           would break the test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 15); ADR 0478 (decision 5).
 */
import { describe, expect, it } from "@stackra/testing";

import * as native from "#native/index";

describe("@stackra/native-card-terminal/native", () => {
  it("exports the card terminal and bridge drivers", () => {
    expect(Object.keys(native).sort()).toEqual([
      "NativeStripeTerminalBridgeDriver",
      "StripeTerminalCardTerminalDriver",
    ]);
  });
});
