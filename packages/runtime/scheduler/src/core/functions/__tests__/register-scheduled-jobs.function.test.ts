/**
 * Stackra file contract:
 * Purpose: unit tests of `registerScheduledJobs`: it records each job action both ways under its locked key, replaces
 *          a class's earlier key, and refuses at boot a class that is not an action, an action with no `job` option,
 *          an empty key, a key another class holds, and a cron that does not parse.
 * Boundary: test only; reads the internal registry to see what was recorded.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decisions 20 and 22); ADR 0305 (rule 28).
 */
import { Action } from "@stackra/actions";
import { ActorKind } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { SCHEDULED_JOBS } from "#core/constants/scheduled-jobs.constant";
import { InvalidCronError } from "#core/errors/invalid-cron.error";
import { registerScheduledJobs } from "#core/functions/register-scheduled-jobs.function";

class ExpireUnpaidOrdersAction extends Action({
  key: "order.expire_unpaid",
  actors: [ActorKind.System],
  job: { queue: "maintenance", unique: true, cron: { schedule: "*/5 * * * *", perTenant: true } },
}) {
  async handle(_input: { batchSize: number }): Promise<void> {}
}

class SendDigestAction extends Action({
  key: "digest.send",
  actors: [ActorKind.System],
  job: { queue: "default" },
}) {
  async handle(_input: object): Promise<void> {}
}

class PlaceOrderAction extends Action({ key: "order.place", actors: [ActorKind.User] }) {
  async handle(_input: object): Promise<void> {}
}

class NotAnAction {}

describe(registerScheduledJobs, () => {
  it("records each job action both ways, with or without a cron", () => {
    registerScheduledJobs([
      { type: ExpireUnpaidOrdersAction, key: "orders.order.expire_unpaid@1" },
      { type: SendDigestAction, key: "digests.digest.send@1" },
    ]);
    expect(SCHEDULED_JOBS.byKey.get("orders.order.expire_unpaid@1")).toBe(ExpireUnpaidOrdersAction);
    expect(SCHEDULED_JOBS.keys.get(SendDigestAction)).toBe("digests.digest.send@1");
  });

  it("replaces a class's earlier key", () => {
    registerScheduledJobs([{ type: SendDigestAction, key: "digests.digest.send@2" }]);
    expect(SCHEDULED_JOBS.keys.get(SendDigestAction)).toBe("digests.digest.send@2");
    expect(SCHEDULED_JOBS.byKey.has("digests.digest.send@1")).toBe(false);
  });

  it("refuses a class that is not an action or declares no job option", () => {
    expect(() => registerScheduledJobs([{ type: NotAnAction as never, key: "x.y.z@1" }])).toThrow(
      /is not an action/,
    );
    expect(() =>
      registerScheduledJobs([{ type: PlaceOrderAction, key: "orders.order.place@1" }]),
    ).toThrow(/declares no job option/);
  });

  it("refuses an empty key and a key another class holds", () => {
    expect(() => registerScheduledJobs([{ type: SendDigestAction, key: "" }])).toThrow(
      /needs its locked key/,
    );
    expect(() =>
      registerScheduledJobs([{ type: SendDigestAction, key: "orders.order.expire_unpaid@1" }]),
    ).toThrow(/share the key/);
  });

  it("refuses a cron that does not parse", () => {
    class BadCronAction extends Action({
      key: "report.build",
      actors: [ActorKind.System],
      job: { cron: { schedule: "61 * * * *" } },
    }) {
      async handle(_input: object): Promise<void> {}
    }
    expect(() =>
      registerScheduledJobs([{ type: BadCronAction, key: "reports.report.build@1" }]),
    ).toThrow(InvalidCronError);
  });
});
