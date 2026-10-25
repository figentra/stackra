/**
 * Stackra file contract:
 * Purpose: unit tests of `RecomputeSegmentsAction`: a job of the job actor with a fifteen-minute timeout and an hourly
 *          per-scope cron with an empty input; with a segment it recomputes that segment, without one it queues every
 *          dynamic segment of the scope.
 * Boundary: test only; the segment service is an in-test fake.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0332 (decision 3); ADR 0148 (decisions 4 and 5); ADR 0305 (rules 28 and
 *                     30).
 */
import { kindOf } from "@stackra/container";
import { ActorKind, type PublicId } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { RecomputeSegmentsAction } from "#node/actions/recompute-segments.action";
import { RecomputeSegmentsInput } from "#node/schemas/recompute-segments-input.schema";
import type { SegmentService } from "#node/services/segment.service";

const SEGMENT = "seg_01j9z3k4m5n6p7q8r9s0t1v2w3" as PublicId<"seg">;

/** An action over a fake segment service. */
function setup() {
  const segments = {
    recompute: vi.fn(async (_segmentId: PublicId<"seg">) => undefined),
    queueRecomputes: vi.fn(async () => 2),
  };
  return {
    action: new RecomputeSegmentsAction(segments as unknown as SegmentService),
    segments,
  };
}

describe(RecomputeSegmentsAction, () => {
  it("is a job of the job actor, run hourly once per scope", () => {
    const record = kindOf(RecomputeSegmentsAction);
    expect(record?.kind).toBe("action");
    expect(record?.options).toMatchObject({
      key: "segment.recompute",
      actors: [ActorKind.Job],
      job: { timeout: "15m", cron: { schedule: "0 * * * *", perScope: true, input: {} } },
    });
  });

  it("recomputes the named segment", async () => {
    const { action, segments } = setup();
    await action.handle(RecomputeSegmentsInput.create({ segmentId: SEGMENT }));
    expect(segments.recompute).toHaveBeenCalledWith(SEGMENT);
    expect(segments.queueRecomputes).not.toHaveBeenCalled();
  });

  it("queues every dynamic segment of the scope on the hourly run", async () => {
    const { action, segments } = setup();
    await action.handle(RecomputeSegmentsInput.create({}));
    expect(segments.queueRecomputes).toHaveBeenCalledTimes(1);
    expect(segments.recompute).not.toHaveBeenCalled();
  });
});
