/**
 * Stackra file contract:
 * Purpose: unit tests of `registerJobs`: a row registers an action under its locked key both ways, a later row moves a
 *          class to its new key, and a non-action, an empty key or a key another class holds is refused.
 * Boundary: test only; reads the process-wide `JOB_TYPES`, with classes of its own.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 20 and 22).
 */
import { Action, Query } from "@stackra/actions";
import { ActorKind } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { JOB_TYPES } from "#core/constants/job-types.constant";
import { registerJobs } from "#core/functions/register-jobs.function";

class PurgeEntriesAction extends Action({
  key: "entry.purge",
  actors: [ActorKind.System],
  job: { queue: "maintenance" },
}) {
  async handle(): Promise<number> {
    return 0;
  }
}

class ExpirePointsAction extends Action({
  key: "points.expire",
  actors: [ActorKind.System],
  job: {},
}) {
  async handle(): Promise<number> {
    return 0;
  }
}

class ListEntriesQuery extends Query({
  key: "entry.list",
  actors: [ActorKind.User],
}) {
  async handle(): Promise<readonly string[]> {
    return [];
  }
}

describe(registerJobs, () => {
  it("registers an action under its locked key, both ways", () => {
    registerJobs([{ type: PurgeEntriesAction, key: "access_log.entry.purge@1" }]);
    expect(JOB_TYPES.byKey.get("access_log.entry.purge@1")).toBe(PurgeEntriesAction);
    expect(JOB_TYPES.keys.get(PurgeEntriesAction)).toBe("access_log.entry.purge@1");
  });

  it("moves a class to the key of a later row", () => {
    registerJobs([{ type: ExpirePointsAction, key: "loyalty_kit.points.expire@1" }]);
    registerJobs([{ type: ExpirePointsAction, key: "loyalty_kit.points.expire@2" }]);
    expect(JOB_TYPES.byKey.has("loyalty_kit.points.expire@1")).toBe(false);
    expect(JOB_TYPES.byKey.get("loyalty_kit.points.expire@2")).toBe(ExpirePointsAction);
  });

  it("refuses a query, an empty key and a key another class holds", () => {
    expect(() =>
      registerJobs([{ type: ListEntriesQuery, key: "access_log.entry.list@1" }]),
    ).toThrow(TypeError);
    expect(() => registerJobs([{ type: PurgeEntriesAction, key: "" }])).toThrow(TypeError);
    expect(() =>
      registerJobs([{ type: ExpirePointsAction, key: "access_log.entry.purge@1" }]),
    ).toThrow(TypeError);
  });
});
