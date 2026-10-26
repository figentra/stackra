/**
 * Stackra file contract:
 * Purpose: unit tests of `serviceAccountId`: the fixed `<deployment>-<purpose>` id, and an id past GCP's 30
 *          characters refused with how much to cut.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0231 (names), ADR 0401.
 */
import { describe, expect, it } from "@stackra/testing";

import { serviceAccountId } from "#core/functions/service-account-id.function";

describe("serviceAccountId", () => {
  it("names the deployment's service account", () => {
    expect(serviceAccountId("acme-platform-production", "infra")).toBe(
      "acme-platform-production-infra",
    );
    expect(serviceAccountId("acme-firm", "stop")).toBe("acme-firm-stop");
  });

  it("refuses an id longer than GCP allows", () => {
    expect(() => serviceAccountId("acme-platform-x-production", "infra")).toThrow(
      /not a GCP service account id .* by 2$/,
    );
  });
});
