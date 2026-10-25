/**
 * Stackra file contract:
 * Purpose: unit tests of `webhookIntegrations`: a service's own Integrations that declare `webhooks` and its hosted
 *          packages' (from their manifests, imported from the entry exporting the file), sorted by route, the own one
 *          winning a shared route; a package or an app receives none.
 * Boundary: test only; runs on the IR fixtures.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0308 (rules 15, 16 and 19); ADR 0224 as amended.
 */
import { describe, expect, it } from "@stackra/testing";

import { webhookIntegrations } from "#core/functions/webhook-integrations.function";
import type { MemberIR } from "#core/types/member-ir.type";
import { BILLING_IR } from "#core/__tests__/fixtures/billing-ir.fixture";
import { WEB_APP_IR } from "#core/__tests__/fixtures/web-app-ir.fixture";

/** A hosted package with one webhook Integration on `path`. */
function hosting(path: string): MemberIR["dependencies"][number] {
  return {
    package: "@acme/payments",
    manifest: {
      member: "payments",
      package: "@acme/payments",
      version: "1.0.0",
      integrations: [
        {
          key: "payments.adyen",
          class: "AdyenIntegration",
          file: "src/node/integrations/adyen.integration.ts",
          webhookPath: path,
        },
      ],
    },
  };
}

describe("webhookIntegrations", () => {
  it("lists own and hosted webhook Integrations by route", () => {
    const ir: MemberIR = {
      ...BILLING_IR,
      dependencies: [hosting("/webhooks/payments/adyen/:connectionId")],
    };
    expect(webhookIntegrations(ir)).toEqual([
      {
        route: "billing/stripe",
        integration: {
          name: "StripeIntegration",
          from: "#modules/billing/integrations/stripe.integration",
        },
      },
      {
        route: "payments/adyen",
        integration: { name: "AdyenIntegration", from: "@acme/payments/node" },
      },
    ]);
  });

  it("keeps the own Integration when a hosted one shares its route", () => {
    const ir: MemberIR = {
      ...BILLING_IR,
      dependencies: [hosting("/webhooks/billing/stripe/:connectionId")],
    };
    expect(webhookIntegrations(ir).map(({ integration }) => integration.name)).toEqual([
      "StripeIntegration",
    ]);
  });

  it("gives a package or an app none", () => {
    expect(webhookIntegrations({ ...BILLING_IR, layout: "package" })).toEqual([]);
    expect(webhookIntegrations(WEB_APP_IR)).toEqual([]);
  });
});
