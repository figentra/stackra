/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: `Backoff` and `queues` (which the template and its generated
 *          `#stackra/queues` import) are exported with the queue service, the drivers, the job registration, the
 *          refusals and the configuration with its shipped schema under the generated name `QueueConfig$`, and nothing
 *          else is a value.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { Backoff } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { QUEUE_CONFIG_SCHEMA } from "#core/constants/queue-config-schema.constant";
import * as queue from "#core/index";

describe("@stackra/queue", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(queue).sort()).toEqual([
      "Backoff",
      "BrokerConfig",
      "BrokerConfig$",
      "BrokerOptions",
      "JOB_BACKOFF",
      "JobNotDueError",
      "JobOutcome",
      "JobTimedOutError",
      "MemoryBrokerPublisherDriver",
      "MemoryQueueDriver",
      "QueueConfig",
      "QueueConfig$",
      "QueueHealthIndicatorDriver",
      "QueueJobDispatcherDriver",
      "QueueOptions",
      "QueueService",
      "TopicBrokerPublisherDriver",
      "UnknownJobError",
      "queues",
      "registerBrokerTopics",
      "registerJobs",
    ]);
  });

  it("exports the shipped schema under its generated name", () => {
    expect(queue.QueueConfig$).toBe(QUEUE_CONFIG_SCHEMA);
  });

  it("takes the template's shapes", () => {
    const Queues = queue.queues(["default", "maintenance"] as const);
    expect(Queues.Maintenance).toBe("maintenance");
    expectTypeOf(Queues.Default).toEqualTypeOf<"default">();
    expect(queue.Backoff.Exponential).toBe("exponential");
    expect(queue.Backoff).toBe(Backoff);
  });
});
