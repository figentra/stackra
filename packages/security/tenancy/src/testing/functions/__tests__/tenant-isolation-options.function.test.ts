/**
 * Stackra file contract:
 * Purpose: unit tests of `tenantIsolationOptions`: the `tenant_id` column, the `app.tenant_id` setting, the default
 *          and a given role, and two distinct fresh tenant ids for the probe.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0239 (decision 1).
 */
import { describe, expect, it } from "@stackra/testing";

import { tenantIsolationOptions } from "#testing/functions/tenant-isolation-options.function";

describe("tenantIsolationOptions", () => {
  it("names the tenant column, its setting and the service role", () => {
    const options = tenantIsolationOptions();
    expect(options.column).toBe("tenant_id");
    expect(options.setting).toBe("app.tenant_id");
    expect(options.role).toBe("stackra_app");
    expect(tenantIsolationOptions("orders_app").role).toBe("orders_app");
  });

  it("probes with two distinct tenant ids", () => {
    const [own, other] = tenantIsolationOptions().probe;
    expect(own).toMatch(/^scp_/);
    expect(other).not.toBe(own);
  });
});
