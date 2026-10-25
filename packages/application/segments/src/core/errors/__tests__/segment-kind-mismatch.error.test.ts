/**
 * Stackra file contract:
 * Purpose: unit tests of `SegmentKindMismatchError`: a non-retryable FailedPrecondition refusal (412) with code
 *          `segment_kind_mismatch` that names the segment and its kind.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0332 (decision 2); ADR 0140.
 */
import { Enum, type PublicId } from "@stackra/contracts";
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { SegmentKind } from "#contracts/index";
import { SegmentKindMismatchError } from "#core/errors/segment-kind-mismatch.error";

/** A segment id. */
const SEGMENT = "seg_01j9z3k4m5n6p7q8r9s0t1v2w3" as PublicId<"seg">;

describe("SegmentKindMismatchError", () => {
  it("is a FailedPrecondition refusal with code segment_kind_mismatch", () => {
    const refused = SegmentKindMismatchError.create({
      segmentId: SEGMENT,
      segmentKind: SegmentKind.Manual,
    });
    expect(isRefusal(refused, SegmentKindMismatchError)).toBe(true);
    expect(refused.kind).toBe(ErrorKind.FailedPrecondition);
    expect(refused.code).toBe("segment_kind_mismatch");
    expect(refused.retryable).toBe(false);
    expect(Enum.meta(ErrorKind, refused.kind).httpStatus).toBe(412);
  });

  it("names the segment and its kind in its envelope", () => {
    expect(
      SegmentKindMismatchError.envelope({ segmentId: SEGMENT, segmentKind: SegmentKind.Dynamic }),
    ).toEqual({
      code: "segment_kind_mismatch",
      category: "precondition_failed",
      retryable: false,
      details: { segmentId: SEGMENT, segmentKind: "dynamic" },
    });
  });
});
