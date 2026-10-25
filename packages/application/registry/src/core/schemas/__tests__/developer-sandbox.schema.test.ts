/**
 * Stackra file contract:
 * Purpose: unit tests of `DeveloperSandbox`: the shipped schema is registered, the apps and expiry default, and an
 *          expiry that is not an ISO instant fails.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0355 (decision 8).
 */
import { describe, expect, it } from "@stackra/testing";
import { schemaOf, validate } from "@stackra/validation";

import { DEVELOPER_SANDBOX_SCHEMA } from "#core/constants/developer-sandbox-schema.constant";
import { DeveloperSandbox } from "#core/schemas/developer-sandbox.schema";

describe("DeveloperSandbox", () => {
  it("registers the shipped schema and defaults its lists", () => {
    expect(schemaOf(DeveloperSandbox)).toBe(DEVELOPER_SANDBOX_SCHEMA);
    const result = validate(DeveloperSandbox, { developer: "usr_1", sandbox: "scp_9" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toMatchObject({ apps: [], expiresAt: null });
  });

  it("takes an ISO instant as the expiry and refuses anything else", () => {
    const base = { developer: "usr_1", sandbox: "scp_9" };
    expect(validate(DeveloperSandbox, { ...base, expiresAt: "2026-12-01T00:00:00Z" }).success).toBe(
      true,
    );
    expect(validate(DeveloperSandbox, { ...base, expiresAt: "next week" }).success).toBe(false);
  });
});
