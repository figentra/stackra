/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryWebhookEntitlementSourceDriver`: nothing granted until granted, grants are per scope
 *          node, only asked keys are answered, a revoke takes a grant back.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0422 (decision 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { WebhookEntitlementSource } from "#contracts/index";
import { MemoryWebhookEntitlementSourceDriver } from "#core/drivers/memory-webhook-entitlement-source.driver";

describe(MemoryWebhookEntitlementSourceDriver, () => {
  it("is a WebhookEntitlementSource that grants nothing until told", async () => {
    const source = new MemoryWebhookEntitlementSourceDriver();
    expect(source).toBeInstanceOf(WebhookEntitlementSource);
    await expect(source.granted(["records.audit_evidence"], "scp_a")).resolves.toEqual(new Set());
  });

  it("answers per scope node and forgets a revoked grant", async () => {
    const source = new MemoryWebhookEntitlementSourceDriver().grant(
      "scp_a",
      "records.audit_evidence",
    );
    await expect(source.granted(["records.audit_evidence", "x.y"], "scp_a")).resolves.toEqual(
      new Set(["records.audit_evidence"]),
    );
    await expect(source.granted(["records.audit_evidence"], "scp_b")).resolves.toEqual(new Set());
    source.revoke("scp_a", "records.audit_evidence");
    await expect(source.granted(["records.audit_evidence"], "scp_a")).resolves.toEqual(new Set());
  });
});
