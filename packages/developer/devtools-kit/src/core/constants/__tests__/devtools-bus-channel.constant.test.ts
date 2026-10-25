/**
 * Stackra file contract:
 * Purpose: unit test of `DEVTOOLS_BUS_CHANNEL`: the bus timeline's channel is `bus` and is itself a valid channel.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0246.
 */
import { describe, expect, it } from "@stackra/testing";

import { DEVTOOLS_BUS_CHANNEL } from "#core/constants/devtools-bus-channel.constant";
import { DEVTOOLS_NAME_PATTERN } from "#core/constants/devtools-name-pattern.constant";

describe("DEVTOOLS_BUS_CHANNEL", () => {
  it("is `bus`, a valid channel name", () => {
    expect(DEVTOOLS_BUS_CHANNEL).toBe("bus");
    expect(DEVTOOLS_NAME_PATTERN.test(DEVTOOLS_BUS_CHANNEL)).toBe(true);
  });
});
