/**
 * Stackra file contract:
 * Purpose: unit tests of `entitlementKey`: `<module>.` + the snake_case class name without its `Entitlement` suffix.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 20); STA-903.
 */
import { describe, expect, it } from "@stackra/testing";

import { entitlementKey } from "#core/functions/entitlement-key.function";

describe("entitlementKey", () => {
  it("derives the key from the module and the class name", () => {
    expect(entitlementKey("catalogue", "ProductLimitEntitlement")).toBe("catalogue.product_limit");
    expect(entitlementKey("pos", "TillLimitEntitlement")).toBe("pos.till_limit");
    expect(entitlementKey("storefront", "ShopperAssistantEntitlement")).toBe(
      "storefront.shopper_assistant",
    );
  });

  it("strips only a trailing Entitlement and snake-cases a multi-word name", () => {
    expect(entitlementKey("ai", "TokenQuotaEntitlement")).toBe("ai.token_quota");
    expect(entitlementKey("billing", "EntitlementAuditEntitlement")).toBe(
      "billing.entitlement_audit",
    );
    expect(entitlementKey("orders", "Exports")).toBe("orders.exports");
  });
});
