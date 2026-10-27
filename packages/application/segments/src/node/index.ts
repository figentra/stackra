/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./node` entry of @stackra/segments (the `Segment` and `SegmentMembership` models with
 *          their services, the recompute job with its input, the subject change consumer, the subject registration, `SegmentPermissions` and the
 *          `SegmentFactProviderDriver` that plugs membership into @stackra/rules)
 *          until `stackra gen` writes the entry barrels and the generated `SegmentsModule` (STA-339).
 * Boundary: names each re-export and declares nothing. Server only: it reads and writes Postgres through
 *           @stackra/database. The migration is found by its path, as every migration is, so it is not re-exported;
 *           the subject registry and the input's shipped schema stay internal.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0127 2026-10-24 note (an entry exists once its folder has a file);
 *                     the STA-347 stand-in barrel decision; ADR 0462 (decision 1).
 */
export { SegmentPermissions } from "#node/access/segment.permissions";
export { RecomputeSegmentsAction } from "#node/actions/recompute-segments.action";
export { SegmentFactProviderDriver } from "#node/drivers/segment-fact-provider.driver";
export { registerSegmentSubjects } from "#node/functions/register-segment-subjects.function";
export { Segment } from "#node/models/segment.model";
export { SegmentMembership } from "#node/models/segment-membership.model";
export { RecomputeSegmentsInput } from "#node/schemas/recompute-segments-input.schema";
export { SegmentService } from "#node/services/segment.service";
export { SegmentMembershipService } from "#node/services/segment-membership.service";
export { SubjectChangeService } from "#node/services/subject-change.service";
