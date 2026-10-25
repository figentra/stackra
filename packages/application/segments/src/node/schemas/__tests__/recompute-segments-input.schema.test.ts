/**
 * Stackra file contract:
 * Purpose: unit tests of `RecomputeSegmentsInput`: a schema class registered with its shipped schema, taking a `seg_`
 *          id or none (the hourly run) and refusing another prefix.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 26); ADR 0332 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";
import { Schema, schemaOf } from "@stackra/validation";

import { RECOMPUTE_SEGMENTS_INPUT_SCHEMA } from "#node/constants/recompute-segments-input-schema.constant";
import { RecomputeSegmentsInput } from "#node/schemas/recompute-segments-input.schema";

describe("RecomputeSegmentsInput", () => {
  it("is a schema class registered with its shipped schema", () => {
    expect(RecomputeSegmentsInput.prototype).toBeInstanceOf(Schema);
    expect(schemaOf(RecomputeSegmentsInput)).toBe(RECOMPUTE_SEGMENTS_INPUT_SCHEMA);
  });

  it("takes a segment id or none, and refuses another prefix", () => {
    expect(RECOMPUTE_SEGMENTS_INPUT_SCHEMA.safeParse({}).success).toBe(true);
    expect(
      RECOMPUTE_SEGMENTS_INPUT_SCHEMA.safeParse({ segmentId: "seg_01j9z3k4m5n6p7q8r9s0t1v2w3" })
        .success,
    ).toBe(true);
    expect(
      RECOMPUTE_SEGMENTS_INPUT_SCHEMA.safeParse({ segmentId: "rset_01j9z3k4m5n6p7q8r9s0t1v2w3" })
        .success,
    ).toBe(false);
  });
});
