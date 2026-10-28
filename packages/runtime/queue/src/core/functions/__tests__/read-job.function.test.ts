/**
 * Stackra file contract:
 * Purpose: unit tests of `readJob`: the template's job option forms read with the defaults applied, the actor kind a
 *          job runs as, the written key registered when gen registered none (and the locked key winning when it did),
 *          the fairness fields (priority, `scopeConcurrency`, `throttle`), and the refusal of a query, an unknown
 *          backoff, a dead-letter hook that is not a method and a fairness field out of range.
 * Boundary: test only; the actions are the shapes of the template's `job` options.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0305 (rules 28 and 30); ADR 0148 (decision 1).
 */
import { Action, Query } from "@stackra/actions";
import { ActorKind, Backoff, Duration } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { JOB_TYPES } from "#core/constants/job-types.constant";
import { readJob } from "#core/functions/read-job.function";
import { registerJobs } from "#core/functions/register-jobs.function";
import type { JobFairnessOptions } from "#core/types/job-fairness-options.type";

/** The fair job option of `ChargeCardAction`, typed apart until @stackra/actions' `JobOptions` lists the fields. */
const FAIR_JOB: JobFairnessOptions & { readonly queue: string } = {
  queue: "payments",
  priority: 5,
  scopeConcurrency: 2,
  throttle: { perMinute: 60, key: "stripe" },
};

class ChargeCardAction extends Action({
  key: "card.charge",
  actors: [ActorKind.System],
  job: FAIR_JOB,
}) {
  async handle(): Promise<void> {}
}

// `queue` keeps a common field with `JobOptions`, so the weak-type check accepts the constant.
const WILD_JOB: JobFairnessOptions & { readonly queue: string } = {
  queue: "default",
  scopeConcurrency: 0,
};

class WildCapAction extends Action({
  key: "cap.wild",
  actors: [ActorKind.System],
  job: WILD_JOB,
}) {
  async handle(): Promise<void> {}
}

const KEYLESS_JOB: JobFairnessOptions & { readonly queue: string } = {
  queue: "default",
  throttle: { perMinute: 10, key: "" },
};

class KeylessThrottleAction extends Action({
  key: "throttle.keyless",
  actors: [ActorKind.System],
  job: KEYLESS_JOB,
}) {
  async handle(): Promise<void> {}
}

class DeliverMessageAction extends Action({
  key: "message.deliver",
  actors: [ActorKind.System],
  job: {
    queue: "delivery",
    retries: 5,
    backoff: Backoff.Exponential,
    deadLetter: true,
    onDeadLetter: "markFailed",
  },
}) {
  async handle(): Promise<void> {}

  async markFailed(): Promise<void> {}
}

class ExpireUnpaidOrdersAction extends Action({
  key: "order.expire_unpaid",
  actors: [ActorKind.System, ActorKind.Job],
  job: {
    queue: "maintenance",
    unique: true,
    timeout: "2m",
    retries: 3,
    cron: { schedule: "*/5 * * * *", perScope: true, input: { batchSize: 100 } },
  },
}) {
  async handle(): Promise<void> {}
}

class VoidPaymentAction extends Action({
  key: "payment.void",
  actors: [ActorKind.Service],
}) {
  async handle(): Promise<void> {}
}

class RenamedHookAction extends Action({
  key: "hook.renamed",
  actors: [ActorKind.System],
  job: { onDeadLetter: "gone" },
}) {
  async handle(): Promise<void> {}
}

class SlowBackoffAction extends Action({
  key: "backoff.slow",
  actors: [ActorKind.System],
  // a stored code from outside the type, as an older manifest could hold
  job: { backoff: "glacial" as Backoff },
}) {
  async handle(): Promise<void> {}
}

class ListOrdersQuery extends Query({
  key: "order.list",
  actors: [ActorKind.User],
}) {
  async handle(): Promise<readonly string[]> {
    return [];
  }
}

describe(readJob, () => {
  it("reads a dead-lettered job with the defaults applied", () => {
    expect(readJob(DeliverMessageAction)).toEqual({
      key: "message.deliver",
      declared: true,
      actor: ActorKind.System,
      queue: "delivery",
      unique: false,
      timeout: Duration.minutes(5),
      retries: 5,
      backoff: Backoff.Exponential,
      deadLetter: true,
      onDeadLetter: "markFailed",
      priority: 0,
    });
  });

  it("reads the fairness fields", () => {
    const plan = readJob(ChargeCardAction);
    expect(plan.priority).toBe(5);
    expect(plan.scopeConcurrency).toBe(2);
    expect(plan.throttle).toEqual({ perMinute: 60, key: "stripe" });
  });

  it("refuses a scope cap below one and a throttle without a key", () => {
    expect(() => readJob(WildCapAction)).toThrow(RangeError);
    expect(() => readJob(KeylessThrottleAction)).toThrow(RangeError);
  });

  it("registers the written key when gen registered none", () => {
    readJob(DeliverMessageAction);
    expect(JOB_TYPES.byKey.get("message.deliver")).toBe(DeliverMessageAction);
  });

  it("reads a unique cron job's timeout and runs it as the job actor it lists", () => {
    registerJobs([{ type: ExpireUnpaidOrdersAction, key: "orders.order.expire_unpaid@1" }]);
    const plan = readJob(ExpireUnpaidOrdersAction);
    expect(plan.key).toBe("orders.order.expire_unpaid@1");
    expect(plan.actor).toBe(ActorKind.Job);
    expect(plan.unique).toBe(true);
    expect(plan.timeout).toBe(Duration.minutes(2));
    expect(plan.deadLetter).toBe(false);
  });

  it("reads an action without a job option as a queued call on the default queue", () => {
    const plan = readJob(VoidPaymentAction);
    expect(plan.declared).toBe(false);
    expect(plan.queue).toBe("default");
    expect(plan.retries).toBe(3);
  });

  it("refuses a query, a hook that is not a method and an unknown backoff", () => {
    expect(() => readJob(ListOrdersQuery as never)).toThrow(TypeError);
    expect(() => readJob(RenamedHookAction)).toThrow(TypeError);
    expect(() => readJob(SlowBackoffAction)).toThrow(RangeError);
  });
});
