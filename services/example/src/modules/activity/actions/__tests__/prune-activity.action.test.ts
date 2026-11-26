/**
 * Stackra file contract:
 * Purpose: unit tests of `PruneActivityAction`: the `activity_entry.prune` job is the system's only, runs daily at
 *          03:30 UTC once per tenant, unique, retried and dead-lettered, and declares the irreversible delete; one run
 *          deletes the entries that happened before `now - keepDays` and answers and audits how many went.
 * Boundary: test only; the action is called directly with a recording stand-in for the service and a fake context whose
 *           clock is frozen. That the cron pushes it through the queue in each tenant is `activity-feed.test.ts`'s.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0148 (decisions 4 and 5); ADR 0305 (rule 28).
 */
import { fakeActionContext } from "@stackra/actions/testing";
import { Effect } from "@stackra/actions/contracts";
import { kindOf } from "@stackra/container";
import { ActorKind } from "@stackra/contracts";
import { describe, expect, freezeClock, it } from "@stackra/testing";

import { PruneActivityAction } from "#modules/activity/actions/prune-activity.action";
import { PruneActivityInput } from "#modules/activity/schemas/prune-activity-input.schema";
import type { ActivityEntryService } from "#modules/activity/services/activity-entry.service";

/** A service that keeps each cutoff it was asked to prune before, and answers `deleted`. */
function recordingEntries(deleted: number) {
  const cutoffs: Date[] = [];
  const entries = {
    prune: async (cutoff: Date) => {
      cutoffs.push(cutoff);
      return deleted;
    },
  } as unknown as ActivityEntryService;
  return { entries, cutoffs };
}

describe(PruneActivityAction, () => {
  it("is a system job, daily at 03:30 UTC in every tenant, unique, retried and dead-lettered", () => {
    expect(kindOf(PruneActivityAction)?.options).toMatchObject({
      key: "activity_entry.prune",
      actors: [ActorKind.System],
      effects: [Effect.Irreversible],
      job: {
        unique: true,
        retries: 3,
        deadLetter: true,
        cron: { schedule: "30 3 * * *", perScope: true, input: { keepDays: 90 } },
      },
    });
  });

  it("deletes what happened before now minus keepDays, and answers and audits the count", async () => {
    freezeClock("2026-09-01T03:30:00Z");
    const { entries, cutoffs } = recordingEntries(4);
    const ctx = fakeActionContext();

    const output = await new PruneActivityAction(entries).handle(
      PruneActivityInput.create({ keepDays: 90 }),
      ctx,
    );

    expect(cutoffs).toEqual([new Date("2026-06-03T03:30:00Z")]);
    expect({ ...output }).toEqual({ deleted: 4 });
    expect(ctx.recorded.audit).toEqual({ keepDays: 90, deleted: 4 });
  });
});
