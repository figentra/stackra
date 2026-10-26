/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: the configuration with its shipped schema under the generated name
 *          `OutboxConfig$`, the memory drivers, the `EventOutbox` driver, the two registrations and the refusal are
 *          its values, and nothing else is.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import { OUTBOX_CONFIG_SCHEMA } from "#core/constants/outbox-config-schema.constant";
import * as outbox from "#core/index";

describe("@stackra/outbox", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(outbox).sort()).toEqual([
      "BrokerEventPublisherDriver",
      "MemoryInboxDriver",
      "MemoryOutboxDriver",
      "OutboxConfig",
      "OutboxConfig$",
      "OutboxEventOutboxDriver",
      "OutboxOptions",
      "UnknownEventError",
      "registerChangeConsumers",
      "registerEventNames",
      "registerRelays",
    ]);
  });

  it("exports the shipped schema under its generated name", () => {
    expect(outbox.OutboxConfig$).toBe(OUTBOX_CONFIG_SCHEMA);
  });
});
