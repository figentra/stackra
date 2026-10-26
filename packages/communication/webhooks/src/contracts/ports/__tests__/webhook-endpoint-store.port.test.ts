/**
 * Stackra file contract:
 * Purpose: unit tests of the `WebhookEndpointStore` and `WebhookDeliveryLog` ports: each is a `Port` whose class is
 *          its token, keyed `webhooks.WebhookEndpointStore` and `webhooks.WebhookDeliveryLog`, and a host's driver over
 *          its own rows implements them.
 * Boundary: test only; minimal in-test drivers stand in for a host's.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0142 (drivers behind ports); ADR 0224 (decisions 1 to 3).
 */
import { Driver } from "@stackra/container";
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { WebhookDeliveryLog } from "#contracts/ports/webhook-delivery-log.port";
import { WebhookEndpointStore } from "#contracts/ports/webhook-endpoint-store.port";
import type { WebhookAttempt } from "#contracts/types/webhook-attempt.type";
import type { WebhookDeliveryTarget } from "#contracts/types/webhook-delivery-target.type";
import type { WebhookTarget } from "#contracts/types/webhook-target.type";

const TARGET: WebhookDeliveryTarget = {
  id: "ple_1",
  scope: { id: "scp_00000000000000000000000001", path: "platform.acme" },
  url: "https://partner.example/leads",
  secrets: ["test-partner-secret"],
};

/** A host's store with one partner target. */
class PartnerWebhookEndpointStoreDriver extends Driver(WebhookEndpointStore) {
  readonly disabled: string[] = [];

  async subscribedTo(): Promise<readonly WebhookTarget[]> {
    return [TARGET];
  }

  async target(id: string): Promise<WebhookDeliveryTarget | null> {
    return id === TARGET.id ? TARGET : null;
  }

  async disable(id: string): Promise<void> {
    this.disabled.push(id);
  }
}

/** A host's log in memory. */
class ListWebhookDeliveryLogDriver extends Driver(WebhookDeliveryLog) {
  readonly attempts: WebhookAttempt[] = [];

  async record(attempt: WebhookAttempt): Promise<void> {
    this.attempts.push(attempt);
  }
}

describe("WebhookEndpointStore", () => {
  it("is a port a host's driver implements", async () => {
    const store: WebhookEndpointStore = new PartnerWebhookEndpointStoreDriver();
    expect(store).toBeInstanceOf(WebhookEndpointStore);
    expect(store).toBeInstanceOf(Port);
    await expect(store.target("ple_1", new Date())).resolves.toBe(TARGET);
    await expect(store.target("ple_2", new Date())).resolves.toBeNull();
    expectTypeOf<WebhookEndpointStore["~key"]>().toEqualTypeOf<"webhooks.WebhookEndpointStore">();
  });
});

describe("WebhookDeliveryLog", () => {
  it("is a port a host's driver implements", async () => {
    const driver = new ListWebhookDeliveryLogDriver();
    const log: WebhookDeliveryLog = driver;
    expect(log).toBeInstanceOf(WebhookDeliveryLog);
    const attempt: WebhookAttempt = {
      endpointId: TARGET.id,
      scope: TARGET.scope,
      eventId: "evt_1",
      eventType: "registry.lead.submitted.v1",
      responseStatus: 204,
      isDelivered: true,
    };
    await log.record(attempt);
    expect(driver.attempts).toEqual([attempt]);
    expectTypeOf<WebhookDeliveryLog["~key"]>().toEqualTypeOf<"webhooks.WebhookDeliveryLog">();
  });
});
