/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./contracts` entry: the `StripeTerminalServer` port and nothing else at
 *          runtime (the module types are erased).
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 15); ADR 0479 (decision 4).
 */
import { describe, expect, it } from "@stackra/testing";

import * as contracts from "#contracts/index";

describe("@stackra/native-card-terminal/contracts", () => {
  it("exports the server port only", () => {
    expect(Object.keys(contracts).sort()).toEqual(["StripeTerminalServer"]);
  });
});
