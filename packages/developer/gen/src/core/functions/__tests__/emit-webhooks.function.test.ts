/**
 * Stackra file contract:
 * Purpose: unit tests of `emitWebhooks`: a service with an Integration that receives webhooks gets the inbound route
 *          `InboundWebhooksController` on `/webhooks/*`, which finds the Integration by its `<module>/<name>` segment
 *          (its own and a hosted package's) and hands the raw body and the decoded query to
 *          `WebhookReceiver.receive`; no file for a service, package or app that receives none.
 * Boundary: test only; runs on the IR fixtures.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0308 (rules 15 and 16); ADR 0224 as amended.
 */
import { describe, expect, it } from "@stackra/testing";

import { emitWebhooks } from "#core/functions/emit-webhooks.function";
import type { MemberIR } from "#core/types/member-ir.type";
import { BILLING_IR } from "#core/__tests__/fixtures/billing-ir.fixture";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";
import { LOYALTY_KIT_IR } from "#core/__tests__/fixtures/loyalty-kit-ir.fixture";

describe("emitWebhooks", () => {
  const hosting: MemberIR = {
    ...BILLING_IR,
    dependencies: [
      ...BILLING_IR.dependencies,
      {
        package: "@stackra/messages",
        manifest: {
          member: "messages",
          package: "@stackra/messages",
          version: "0.1.0",
          integrations: [
            {
              key: "messages.resend",
              class: "ResendIntegration",
              file: "src/node/integrations/resend.integration.ts",
              webhookPath: "/webhooks/messages/resend/:connectionId",
            },
          ],
        },
      },
    ],
  };
  const route = emitWebhooks(hosting) ?? "";

  it("maps each webhook path to its Integration, own and hosted", () => {
    expect(route).toContain(
      'import { StripeIntegration } from "#modules/billing/integrations/stripe.integration";',
    );
    expect(route).toContain('import { ResendIntegration } from "@stackra/messages/node";');
    expect(route).toContain(
      [
        "const INTEGRATIONS: Readonly<Record<string, IntegrationClass>> = {",
        '  "billing/stripe": StripeIntegration,',
        '  "messages/resend": ResendIntegration,',
        "};",
      ].join("\n"),
    );
  });

  it("receives the raw body through the WebhookReceiver", () => {
    expect(route).toContain(
      'export class InboundWebhooksController extends Controller({ path: "/webhooks/*" }) {',
    );
    expect(route).toContain("  constructor(receiver: WebhookReceiver) {");
    expect(route).toContain("      body: await request.text(),");
    expect(route).toContain(
      "    if (integration === undefined) return new Response(null, { status: 404 });",
    );
    expect(route).toContain("    return new Response(null, { status: 202 });");
    expect(route).toContain('import { Controller } from "@stackra/app/server";');
    expect(route).toContain('import type { IntegrationClass } from "@stackra/integrations";');
    expect(route).toContain('import { WebhookReceiver } from "@stackra/webhooks";');
  });

  it("passes the decoded query parameters as InboundWebhook.query", () => {
    expect(route).toContain("    const url = new URL(request.url);");
    expect(route).toContain(
      '    const [module, name, connectionId] = url.pathname.split("/").slice(2);',
    );
    expect(route).toContain("      query: Object.fromEntries(url.searchParams),");
  });

  it("writes nothing for a member that receives no webhook", () => {
    expect(emitWebhooks(COMMERCE_IR)).toBeUndefined();
    expect(emitWebhooks(LOYALTY_KIT_IR)).toBeUndefined();
  });
});
