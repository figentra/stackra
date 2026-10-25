/**
 * Stackra file contract:
 * Purpose: unit tests of `PointsIssuedInput`: a registered shape with no fields.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0328.
 */
import { describe, expect, it } from "@stackra/testing";
import { Schema } from "@stackra/validation";

import { PointsIssuedInput } from "#node/schemas/points-issued-input.schema";

describe("PointsIssuedInput", () => {
  it("has no fields", () => {
    const input = PointsIssuedInput.create({});
    expect(input).toBeInstanceOf(Schema);
    expect({ ...input }).toEqual({});
  });
});
