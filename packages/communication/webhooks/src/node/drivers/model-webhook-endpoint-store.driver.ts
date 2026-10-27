/**
 * Stackra file contract:
 * Purpose: the `model` `WebhookEndpointStore`: this package's own receivers, the `WebhookEndpoint` rows of
 *          `webhooks.webhook_endpoints`, answered through `WebhookEndpointService` (its entitlement gate included),
 *          with the signing secrets read blind from the `SecretStore` by the names an endpoint holds.
 * Boundary: the default store; a service with its own endpoint tables binds its own driver instead and this one, the
 *           model and its migration go unused there. Secret values are read only in `target`, at the attempt, and
 *           kept nowhere.
 * Runtime: node
 * Governing contract: ADR 0224 (decisions 1 to 3); ADR 0308 (rule 17); ADR 0173; ADR 0142 (drivers behind ports).
 */
import type { SecretStore } from "@stackra/config/contracts";
import { Driver } from "@stackra/container";
import type { PublicId } from "@stackra/contracts";

import { WebhookEndpointStore } from "#contracts/index";
import type { WebhookDeliveryTarget, WebhookTarget } from "#contracts/index";
import type { WebhookEndpoint } from "#node/models/webhook-endpoint.model";
import type { WebhookEndpointService } from "#node/services/webhook-endpoint.service";

/** The target of `endpoint`. */
const targetOf = (endpoint: WebhookEndpoint): WebhookTarget => ({
  id: endpoint.id,
  scope: { id: endpoint.scopeId, path: endpoint.scopePath },
  url: endpoint.url,
});

/**
 * Answers the delivery machinery from `WebhookEndpoint` rows.
 *
 * @example
 * const target = await new ModelWebhookEndpointStoreDriver(endpoints, secrets).target("whe_…", now);
 */
export class ModelWebhookEndpointStoreDriver extends Driver(WebhookEndpointStore) {
  /** The endpoint service. */
  private readonly endpoints: WebhookEndpointService;

  /** Resolves the signing secrets by name. */
  private readonly secrets: SecretStore;

  /**
   * @param endpoints - the endpoint service.
   * @param secrets - the secret store.
   */
  constructor(endpoints: WebhookEndpointService, secrets: SecretStore) {
    super();
    this.endpoints = endpoints;
    this.secrets = secrets;
  }

  /** Implements `WebhookEndpointStore.subscribedTo`, documented there. */
  async subscribedTo(scopeId: string, type: string): Promise<readonly WebhookTarget[]> {
    return (await this.endpoints.subscribedTo(scopeId, type)).map(targetOf);
  }

  /**
   * See `WebhookEndpointStore.target`.
   *
   * @throws TypeError when a signing secret the endpoint names has no value in the secret store.
   */
  async target(id: string, now: Date): Promise<WebhookDeliveryTarget | null> {
    const endpoint = await this.endpoints.findOne({ id: id as PublicId<"whe"> });
    if (endpoint === null || endpoint.disabledAt !== null) return null;
    const secrets = endpoint.secretNamesAt(now).map((name) => {
      const value = this.secrets.get(name);
      if (value === undefined || value === "")
        throw new TypeError(`The webhook signing secret ${name} has no value in the secret store`);
      return value;
    });
    return { ...targetOf(endpoint), secrets };
  }

  /** Implements `WebhookEndpointStore.disable`, documented there. */
  disable(id: string, at: Date): Promise<void> {
    return this.endpoints.disable(id as PublicId<"whe">, at);
  }
}
