/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./node` entry: the server analytics relay and erasure listeners are exported,
 *          nothing else is.
 * Boundary: test only; imports the stand-in barrel through its `#node` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0294 (decision 15); ADR 0022; STA-1512; STA-1582.
 */
import { describe, expect, it } from "@stackra/testing";

import * as node from "#node/index";

describe("@stackra/analytics/node", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(node).sort()).toEqual([
      "EraseAnalyticsPersonListener",
      "RelayTrackedAnalyticsListener",
    ]);
  });
});
