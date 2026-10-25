/**
 * Stackra file contract:
 * Purpose: unit tests of `EmbeddedValue`: weight or price.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; the COM-241 answer.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { EmbeddedValue } from "#core/enums/embedded-value.enum";

describe("EmbeddedValue", () => {
  it("is weight or price", () => {
    expect(Enum.values(EmbeddedValue)).toEqual(["weight", "price"]);
  });
});
