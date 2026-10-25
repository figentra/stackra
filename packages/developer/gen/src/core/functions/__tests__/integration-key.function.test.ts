/**
 * Stackra file contract:
 * Purpose: unit tests of `integrationKey`: `<module>.<snake(class minus "Integration")>`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0308 (rule 19).
 */
import { describe, expect, it } from "@stackra/testing";

import { integrationKey } from "#core/functions/integration-key.function";

describe("integrationKey", () => {
  it("joins the module and the snake-cased provider name", () => {
    expect(integrationKey("messages", "ResendIntegration")).toBe("messages.resend");
    expect(integrationKey("billing", "StripeConnectIntegration")).toBe("billing.stripe_connect");
  });
});
