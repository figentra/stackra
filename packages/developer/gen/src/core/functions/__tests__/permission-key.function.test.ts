/**
 * Stackra file contract:
 * Purpose: unit tests of `permissionKey`: the class without `Permissions` and the verb, both snake-cased.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 20); ADR 0208.
 */
import { describe, expect, it } from "@stackra/testing";

import { permissionKey } from "#core/functions/permission-key.function";

describe("permissionKey", () => {
  it("derives `<module>.<model>.<verb>`", () => {
    expect(permissionKey("orders", "OrderPermissions", "cancel")).toBe("orders.order.cancel");
    expect(permissionKey("loyalty_kit", "LoyaltyAccountPermissions", "viewBalance")).toBe(
      "loyalty_kit.loyalty_account.view_balance",
    );
  });
});
