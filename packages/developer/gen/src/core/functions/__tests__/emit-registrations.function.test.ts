/**
 * Stackra file contract:
 * Purpose: unit tests of `emitRegistrations`: the generated entity and schemas files loaded first, then one call per
 *          platform registration with a row each, from the locked identities: the hosted packages' entity lists, the
 *          model partners of each `CrudService<M>`, event wire names, jobs for the queue and the scheduler,
 *          connections, webhook events, outbound webhooks, sequences (a hosted package's imported from its entry) and
 *          searchable models; no file for an app or a member with nothing to register.
 * Boundary: test only; runs on the IR fixtures and the manifests `buildManifest` derives from them.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 20 and 22); ADR 0097; ADR 0141; ADR 0308;
 *                     ADR 0342.
 */
import { describe, expect, it } from "@stackra/testing";

import { buildManifest } from "#core/functions/build-manifest.function";
import { emitRegistrations } from "#core/functions/emit-registrations.function";
import type { MemberIR } from "#core/types/member-ir.type";
import { BILLING_IR } from "#core/__tests__/fixtures/billing-ir.fixture";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";
import { WEB_APP_IR } from "#core/__tests__/fixtures/web-app-ir.fixture";

/** The registrations of `ir` against its own derived manifest. */
function registrationsOf(ir: MemberIR): string | undefined {
  return emitRegistrations(ir, buildManifest(ir).manifest);
}

describe("emitRegistrations", () => {
  const billing = registrationsOf(BILLING_IR) ?? "";

  it("loads the generated entity and schemas files first", () => {
    const body = billing.slice(billing.indexOf("*/") + 3);
    expect(body.startsWith('import "#stackra/entities/billing";\n')).toBe(true);
    expect(body).toContain('import "#stackra/entities/crm";\nimport "#stackra/schemas/billing";');
    expect(body).toContain('import "#stackra/schemas/crm";');
  });

  it("registers hosted entities and model partners", () => {
    expect(billing).toContain("registerEntities([...SEGMENTS_ENTITIES]);");
    expect(billing).toMatch(
      /import \{[^}]*SEGMENTS_ENTITIES[^}]*\} from "@stackra\/segments\/node";/,
    );
    expect(billing).toContain("registerModelPartners([\n  [InvoiceService, Invoice],\n]);");
    expect(billing).not.toContain("InvoiceFactory");
  });

  it("registers event names, jobs and outbound webhooks by their locked identities", () => {
    expect(billing).toContain(
      'registerEventNames([\n  { type: InvoiceIssued, name: "billing.invoice.issued.v2" },\n]);',
    );
    const job = '  { type: SendRemindersAction, key: "billing.invoice.send_reminders@1" },';
    expect(billing).toContain(`registerJobs([\n${job}\n]);`);
    expect(billing).toContain(`registerScheduledJobs([\n${job}\n]);`);
    expect(billing).toContain(
      'registerOutboundWebhooks([\n  { type: InvoiceIssued, name: "billing.invoice.issued.v2" },\n]);',
    );
    expect(billing).toContain('import { registerOutboundWebhooks } from "@stackra/webhooks/node";');
  });

  it("registers connections, webhook events, sequences and searchable models", () => {
    expect(billing).toContain(
      'registerConnections([\n  { connection: StripeConnection, integration: StripeIntegration, key: "billing.stripe" },\n]);',
    );
    expect(billing).toContain(
      "registerWebhookEvents([\n  { event: StripePaymentSucceeded, integration: StripeIntegration, connection: StripeConnection },\n]);",
    );
    expect(billing).toContain(
      [
        "registerSequences([",
        '  { type: InvoiceSequence, key: "billing.invoice" },',
        '  { type: SegmentExportSequence, key: "segments.export" },',
        "]);",
      ].join("\n"),
    );
    expect(billing).toMatch(
      /import \{[^}]*SegmentExportSequence[^}]*\} from "@stackra\/segments\/node";/,
    );
    expect(billing).toContain("registerSearchableModels([\n  Invoice,\n]);");
    expect(billing).toContain(
      'import { registerEntities, registerModelPartners, registerSequences } from "@stackra/database";',
    );
  });

  it("writes no file for an app or a member with nothing to register", () => {
    expect(registrationsOf(WEB_APP_IR)).toBeUndefined();
    expect(registrationsOf({ ...COMMERCE_IR, classes: [], shapes: [], enums: [] })).toBeUndefined();
  });
});
