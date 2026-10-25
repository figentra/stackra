/**
 * Stackra file contract:
 * Purpose: `RECOMPUTE_SEGMENTS_INPUT_SCHEMA`, the zod schema this package ships for `RecomputeSegmentsInput`: an
 *          optional `seg_` id.
 * Boundary: the stand-in for what gen writes for this package; the pipeline checks each job's stored input with it
 *           before an attempt runs. Whether the segment still exists is the job's check.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0095 as amended.
 */
import { publicId } from "@stackra/validation";
import { z } from "zod";

/** The shipped `RecomputeSegmentsInput$`. */
export const RECOMPUTE_SEGMENTS_INPUT_SCHEMA = z.object({
  segmentId: publicId("seg").optional(),
});
