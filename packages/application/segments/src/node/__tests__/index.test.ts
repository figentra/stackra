/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./node` entry: the two models with their services, the recompute job with its
 *          input, the subject change consumer and the subject registration are its values, and nothing else.
 * Boundary: test only; imports the stand-in barrel through its `#node` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import * as node from "#node/index";

describe("@stackra/segments/node", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(node).sort()).toEqual([
      "RecomputeSegmentsAction",
      "RecomputeSegmentsInput",
      "Segment",
      "SegmentMembership",
      "SegmentMembershipService",
      "SegmentService",
      "SubjectChangeService",
      "registerSegmentSubjects",
    ]);
  });
});
