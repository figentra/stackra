/**
 * Stackra file contract:
 * Purpose: unit tests of `ExpirePointsInput`: a registered shape whose batch size defaults to 500 and stays within 1 to
 *          5 000.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0328.
 */
import { describe, expect, it } from "@stackra/testing";

import { ExpirePointsInput } from "#node/schemas/expire-points-input.schema";

describe("ExpirePointsInput", () => {
  it("defaults the batch to 500 and bounds it", () => {
    expect(ExpirePointsInput.create({} as ExpirePointsInput).batchSize).toBe(500);
    expect(() => ExpirePointsInput.create({ batchSize: 0 })).toThrow();
    expect(() => ExpirePointsInput.create({ batchSize: 5001 })).toThrow();
  });
});
