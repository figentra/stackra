/**
 * Stackra file contract:
 * Purpose: unit tests of `QUEUE_DRIVERS`: it names every shipped `QueueDriver` driver once, by its file prefix, and
 *          the shipped schema's `driver` enum is the same list.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 4); ADR 0263 (decision 9).
 */
import { describe, expect, it } from "@stackra/testing";

import { QUEUE_CONFIG_SCHEMA } from "#core/constants/queue-config-schema.constant";
import { QUEUE_DRIVERS } from "#core/constants/queue-drivers.constant";
import { MemoryQueueDriver } from "#core/drivers/memory-queue.driver";
import { PostgresQueueDriver } from "#node/drivers/postgres-queue.driver";

/** `MemoryQueueDriver` to `memory`: the class name less the port and kind, in lower case. */
const driverName = (type: { readonly name: string }): string =>
  type.name.replace(/QueueDriver$/, "").toLowerCase();

describe("QUEUE_DRIVERS", () => {
  it("names every shipped driver once", () => {
    expect([...QUEUE_DRIVERS]).toEqual([PostgresQueueDriver, MemoryQueueDriver].map(driverName));
  });

  it("is the schema's driver enum", () => {
    expect(QUEUE_CONFIG_SCHEMA.shape.driver.unwrap().options).toEqual([...QUEUE_DRIVERS]);
  });
});
