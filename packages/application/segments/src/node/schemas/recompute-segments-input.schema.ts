/**
 * Stackra file contract:
 * Purpose: `RecomputeSegmentsInput`, the input of the `segment.recompute` job: the segment to recompute in full, or none
 *          for the hourly run that queues a recompute of every dynamic segment of its scope.
 * Boundary: a shape class in schemas/, one declaration per file; it registers this package's own schema
 *           (`RECOMPUTE_SEGMENTS_INPUT_SCHEMA`) when the module loads.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4 and 26); ADR 0305 (Input and Output in their own files); ADR 0332
 *                     (decision 3).
 */
import type { PublicId } from "@stackra/contracts";
import { registerSchemas, Schema } from "@stackra/validation";

import { RECOMPUTE_SEGMENTS_INPUT_SCHEMA } from "#node/constants/recompute-segments-input-schema.constant";

/** What one recompute job does. */
export class RecomputeSegmentsInput extends Schema {
  /** The segment to recompute; absent for the hourly run of a scope. */
  segmentId?: PublicId<"seg">;
}

registerSchemas([[RecomputeSegmentsInput, RECOMPUTE_SEGMENTS_INPUT_SCHEMA]]);
