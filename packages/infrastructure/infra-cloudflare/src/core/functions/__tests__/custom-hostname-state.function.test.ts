/**
 * Stackra file contract:
 * Purpose: unit tests of `customHostnameState`: Cloudflare's hostname and certificate statuses mapped onto the
 *          ADR 0276 states.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0276 (open detail 1).
 */
import { describe, expect, it } from "@stackra/testing";

import { customHostnameState } from "#core/functions/custom-hostname-state.function";

describe("customHostnameState", () => {
  it("maps each report", () => {
    expect(customHostnameState({ status: "pending", ssl: { status: "initializing" } })).toBe(
      "pending_ownership",
    );
    expect(customHostnameState({ status: "active", ssl: { status: "pending_validation" } })).toBe(
      "pending_certificate",
    );
    expect(customHostnameState({ status: "active", ssl: null })).toBe("pending_certificate");
    expect(customHostnameState({ status: "active", ssl: { status: "active" } })).toBe("active");
    expect(customHostnameState({ status: "blocked" })).toBe("failed");
    expect(customHostnameState({ status: "active", ssl: { status: "validation_timed_out" } })).toBe(
      "failed",
    );
  });
});
