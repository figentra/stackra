/**
 * Stackra file contract:
 * Purpose: unit tests of `ConfigSubscriberSourceDriver`: it is a `SubscriberSource` and lists only the subscribers whose
 *          events include the versioned type, none for a type nobody takes.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0511 (decision 17; P-009).
 */
import { describe, expect, it } from "@stackra/testing";

import { SubscriberSource } from "#contracts/index";
import { relayConfig } from "#core/__tests__/fixtures/relay-key.fixture";
import { ConfigSubscriberSourceDriver } from "#core/drivers/config-subscriber-source.driver";

const BILLING = {
  member: "billing",
  inbox: "https://billing.example.com",
  events: ["payments.payment.captured.v1", "payments.payment.failed.v1"],
};

const OS = {
  member: "os",
  inbox: "https://os.example.com",
  events: ["payments.payment.captured.v1"],
};

describe(ConfigSubscriberSourceDriver, () => {
  const source = new ConfigSubscriberSourceDriver(relayConfig({ subscribers: [BILLING, OS] }));

  it("is a SubscriberSource", () => {
    expect(source).toBeInstanceOf(SubscriberSource);
  });

  it("lists the subscribers of a versioned type only", async () => {
    await expect(source.subscribersOf("payments.payment.captured.v1")).resolves.toEqual([
      BILLING,
      OS,
    ]);
    await expect(source.subscribersOf("payments.payment.failed.v1")).resolves.toEqual([BILLING]);
    await expect(source.subscribersOf("payments.payment.failed.v2")).resolves.toEqual([]);
  });
});
