/**
 * Stackra file contract:
 * Purpose: unit tests of the `model` `WebhookEndpointStore` and `WebhookDeliveryLog` drivers: subscribers come from
 *          `WebhookEndpointService.subscribedTo` as targets; `target` answers an enabled endpoint with its secret
 *          values (both during a rotation), `null` for a removed or disabled one, and throws for a secret with no
 *          value; `disable` goes to the service; an attempt is logged as a `WebhookDelivery` row.
 * Boundary: test only; the services and the secret store are in-test fakes.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0224 (decisions 1 to 3); ADR 0308 (rule 17); ADR 0173.
 */
import type { SecretStore } from "@stackra/config/contracts";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { WebhookDeliveryLog, WebhookEndpointStore } from "#contracts/index";
import { ModelWebhookDeliveryLogDriver } from "#node/drivers/model-webhook-delivery-log.driver";
import { ModelWebhookEndpointStoreDriver } from "#node/drivers/model-webhook-endpoint-store.driver";
import { WebhookEndpoint } from "#node/models/webhook-endpoint.model";
import type { WebhookDeliveryService } from "#node/services/webhook-delivery.service";
import type { WebhookEndpointService } from "#node/services/webhook-endpoint.service";

const AT = new Date("2026-10-25T09:00:00Z");
const SCOPE = { id: "scp_00000000000000000000000001", path: "platform.acme" } as const;
const SECRETS: Readonly<Record<string, string>> = {
  ACME_WEBHOOK_SECRET_1: "test-old-signing-secret",
  ACME_WEBHOOK_SECRET_2: "test-new-signing-secret",
};

/** A stored endpoint with `data`. */
const endpointOf = (data: Partial<WebhookEndpoint> = {}): WebhookEndpoint =>
  Object.assign(new WebhookEndpoint(), {
    scopeId: SCOPE.id,
    scopePath: SCOPE.path,
    url: "https://hooks.acme.example/in",
    events: ["orders.order.paid.v1"],
    secretName: "ACME_WEBHOOK_SECRET_2",
    previousSecretName: null,
    rotatedAt: null,
    disabledAt: null,
    ...data,
  });

/** A store over a service holding `endpoint`. */
function setup(endpoint: WebhookEndpoint | null) {
  const service = {
    subscribedTo: vi.fn(async () => (endpoint === null ? [] : [endpoint])),
    findOne: vi.fn(async () => endpoint),
    disable: vi.fn(async () => undefined),
  };
  const store = new ModelWebhookEndpointStoreDriver(
    service as unknown as WebhookEndpointService,
    { get: (name: string) => SECRETS[name] } as unknown as SecretStore,
  );
  return { store, service };
}

describe(ModelWebhookEndpointStoreDriver, () => {
  it("is a WebhookEndpointStore answering subscribers as targets", async () => {
    const endpoint = endpointOf();
    const { store, service } = setup(endpoint);
    expect(store).toBeInstanceOf(WebhookEndpointStore);
    await expect(store.subscribedTo(SCOPE.id, "orders.order.paid.v1")).resolves.toEqual([
      { id: endpoint.id, scope: SCOPE, url: endpoint.url },
    ]);
    expect(service.subscribedTo).toHaveBeenCalledWith(SCOPE.id, "orders.order.paid.v1");
  });

  it("resolves an enabled endpoint's secrets, both during a rotation", async () => {
    const plain = setup(endpointOf());
    await expect(plain.store.target("whe_1", AT)).resolves.toMatchObject({
      secrets: ["test-new-signing-secret"],
    });
    const rotating = setup(
      endpointOf({
        previousSecretName: "ACME_WEBHOOK_SECRET_1",
        rotatedAt: new Date(AT.getTime() - 3_600_000),
      }),
    );
    await expect(rotating.store.target("whe_1", AT)).resolves.toMatchObject({
      secrets: ["test-new-signing-secret", "test-old-signing-secret"],
    });
  });

  it("answers null for a removed or disabled endpoint, and throws for a secret with no value", async () => {
    await expect(setup(null).store.target("whe_1", AT)).resolves.toBeNull();
    await expect(
      setup(endpointOf({ disabledAt: AT })).store.target("whe_1", AT),
    ).resolves.toBeNull();
    await expect(
      setup(endpointOf({ secretName: "ACME_WEBHOOK_SECRET_MISSING" })).store.target("whe_1", AT),
    ).rejects.toThrow("ACME_WEBHOOK_SECRET_MISSING has no value");
  });

  it("disables through the service", async () => {
    const { store, service } = setup(endpointOf());
    await store.disable("whe_1", AT);
    expect(service.disable).toHaveBeenCalledWith("whe_1", AT);
  });
});

describe(ModelWebhookDeliveryLogDriver, () => {
  it("is a WebhookDeliveryLog writing one WebhookDelivery row", async () => {
    const deliveries = { record: vi.fn(async () => undefined) };
    const log = new ModelWebhookDeliveryLogDriver(deliveries as unknown as WebhookDeliveryService);
    expect(log).toBeInstanceOf(WebhookDeliveryLog);
    await log.record({
      endpointId: "whe_1",
      scope: SCOPE,
      eventId: "evt_1",
      eventType: "orders.order.paid.v1",
      responseStatus: 204,
      isDelivered: true,
    });
    expect(deliveries.record).toHaveBeenCalledWith({
      endpointId: "whe_1",
      scopeId: SCOPE.id,
      scopePath: SCOPE.path,
      eventId: "evt_1",
      eventType: "orders.order.paid.v1",
      responseStatus: 204,
      isDelivered: true,
    });
  });
});
