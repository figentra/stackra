/**
 * Stackra file contract:
 * Purpose: unit tests of `OUTBOX_DRIVERS`: it names every shipped message and inbox driver by its file prefix, and it
 *          is the shipped schema's driver enum.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0142.
 */
import { describe, expect, it } from "@stackra/testing";

import { OUTBOX_CONFIG_SCHEMA } from "#core/constants/outbox-config-schema.constant";
import { OUTBOX_DRIVERS } from "#core/constants/outbox-drivers.constant";
import { MemoryInboxDriver } from "#core/drivers/memory-inbox.driver";
import { MemoryOutboxDriver } from "#core/drivers/memory-outbox.driver";
import { PostgresInboxDriver } from "#node/drivers/postgres-inbox.driver";
import { PostgresOutboxDriver } from "#node/drivers/postgres-outbox.driver";

/** `MemoryOutboxDriver` to `memory`: the class name less the port and kind, in lower case. */
const driverName = (type: { readonly name: string }): string =>
  type.name.replace(/(Outbox|Inbox)Driver$/, "").toLowerCase();

describe("OUTBOX_DRIVERS", () => {
  it("names every shipped message driver and inbox driver once", () => {
    expect([...OUTBOX_DRIVERS]).toEqual([PostgresOutboxDriver, MemoryOutboxDriver].map(driverName));
    expect([...OUTBOX_DRIVERS]).toEqual([PostgresInboxDriver, MemoryInboxDriver].map(driverName));
  });

  it("is the schema's driver enum", () => {
    expect(OUTBOX_CONFIG_SCHEMA.shape.driver.unwrap().options).toEqual([...OUTBOX_DRIVERS]);
  });
});
