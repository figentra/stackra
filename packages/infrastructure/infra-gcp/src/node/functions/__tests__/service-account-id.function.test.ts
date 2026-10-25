/**
 * Stackra file contract:
 * Purpose: unit tests of `serviceAccountId`: the fixed `<project>-<environment>-infra` id, and an id past GCP's 30
 *          characters refused.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0231 (names).
 */
import { describe, expect, it } from "@stackra/testing";

import { serviceAccountId } from "#node/functions/service-account-id.function";

describe("serviceAccountId", () => {
  it("names the environment's infra service account", () => {
    expect(serviceAccountId("acme-platform", "production")).toBe("acme-platform-production-infra");
  });

  it("refuses an id longer than GCP allows", () => {
    expect(() => serviceAccountId("acme-platform-x", "production")).toThrow(
      /not a GCP service account id/,
    );
  });
});
