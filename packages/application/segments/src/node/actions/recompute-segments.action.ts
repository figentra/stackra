/**
 * Stackra file contract:
 * Purpose: `segments.segment.recompute@1`, the recompute job: with a segment, recomputes its membership in full; without
 *          one, which is the hourly run of each scope, queues a recompute of every dynamic segment of that scope, so
 *          conditions on the time and revisions published elsewhere are caught up.
 * Boundary: a job only (the job actor, no endpoint, no tool). The scheduler pushes the hourly run once per scope its
 *           `CronScopes` driver lists, and each run reads only the segments of its scope session; a segment's recompute
 *           runs in the segment's own scope, so row-level security applies to every read. Recomputing is idempotent:
 *           a retry, or two runs of one segment, change membership once (the membership table is unique per segment
 *           and subject).
 * Runtime: node
 * Governing contract: ADR 0332 (decision 3); ADR 0148 (decisions 1, 4 and 5); ADR 0305 (rules 28 and 30).
 */
import { Action } from "@stackra/actions";
import { ActorKind } from "@stackra/contracts";

import type { RecomputeSegmentsInput } from "#node/schemas/recompute-segments-input.schema";
import type { SegmentService } from "#node/services/segment.service";

/** Recomputes segment membership. */
export class RecomputeSegmentsAction extends Action({
  key: "segment.recompute",
  actors: [ActorKind.Job],
  job: {
    timeout: "15m",
    cron: { schedule: "0 * * * *", perScope: true, input: {} },
  },
}) {
  /** Recomputes and queues. */
  private readonly segments: SegmentService;

  /** @param segments - the segment service. */
  constructor(segments: SegmentService) {
    super();
    this.segments = segments;
  }

  /** Recomputes the named segment, or queues every dynamic segment of the scope. */
  async handle(input: RecomputeSegmentsInput): Promise<void> {
    if (input.segmentId === undefined) await this.segments.queueRecomputes();
    else await this.segments.recompute(input.segmentId);
  }
}
