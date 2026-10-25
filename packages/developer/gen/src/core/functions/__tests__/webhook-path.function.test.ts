/**
 * Stackra file contract:
 * Purpose: unit tests of `webhookPath`: `/webhooks/<kebab(module)>/<kebab(class minus "Integration")>/:connectionId`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0308 (rules 16 and 19).
 */
import { describe, expect, it } from "@stackra/testing";

import { webhookPath } from "#core/functions/webhook-path.function";

describe("webhookPath", () => {
  it("derives the inbound path from the module and the class", () => {
    expect(webhookPath("messages", "ResendIntegration")).toBe(
      "/webhooks/messages/resend/:connectionId",
    );
    expect(webhookPath("loyalty_kit", "StripeConnectIntegration")).toBe(
      "/webhooks/loyalty-kit/stripe-connect/:connectionId",
    );
  });
});
