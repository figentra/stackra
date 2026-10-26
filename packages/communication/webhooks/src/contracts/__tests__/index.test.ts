/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./contracts` entry: its values are the five ports.
 * Boundary: test only; imports the stand-in barrel through its `#contracts` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import * as contracts from "#contracts/index";

describe("@stackra/webhooks/contracts", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(contracts).sort()).toEqual([
      "WebhookDeliveryLog",
      "WebhookEndpointStore",
      "WebhookEntitlementSource",
      "WebhookObjectSink",
      "WebhookSender",
    ]);
  });
});
