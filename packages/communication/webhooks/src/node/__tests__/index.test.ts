/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./node` entry: the outbound delivery job, its input, the fan-out listener, the
 *          two models with their services and the outbound registration are its values, and nothing else.
 * Boundary: test only; imports the stand-in barrel through its `#node` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import * as node from "#node/index";

describe("@stackra/webhooks/node", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(node).sort()).toEqual([
      "DeliverWebhookAction",
      "DeliverWebhookInput",
      "ModelWebhookDeliveryLogDriver",
      "ModelWebhookEndpointStoreDriver",
      "S3WebhookObjectSinkDriver",
      "SendWebhooksListener",
      "WebhookDelivery",
      "WebhookDeliveryService",
      "WebhookEndpoint",
      "WebhookEndpointService",
      "registerOutboundWebhooks",
    ]);
  });
});
