/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./contracts` entry: the port and its item type, nothing else.
 * Boundary: test only; imports the stand-in barrel through its `#contracts` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as contracts from "#contracts/index";
import type { DeviceSearchItem } from "#contracts/index";

describe("@stackra/native-spotlight/contracts", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(contracts).sort()).toEqual(["DeviceSearchIndex"]);
  });

  it("exports the item type", () => {
    expectTypeOf<DeviceSearchItem["url"]>().toEqualTypeOf<string>();
  });
});
