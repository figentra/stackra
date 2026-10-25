/**
 * Stackra file contract:
 * Purpose: unit tests of `roleName`: the fixed `<project>-<environment>-<purpose>` name, and a name past IAM's 64
 *          characters refused.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0172 (decision 1: environments separated by IAM roles).
 */
import { describe, expect, it } from "@stackra/testing";

import { roleName } from "#node/functions/role-name.function";

describe("roleName", () => {
  it("joins the project, environment and purpose", () => {
    expect(roleName("acme-platform", "staging", "infra")).toBe("acme-platform-staging-infra");
  });

  it("allows exactly 64 characters", () => {
    const project = "p".repeat(64 - "-prod-infra".length);

    expect(roleName(project, "prod", "infra")).toHaveLength(64);
  });

  it("refuses a name past 64 characters", () => {
    expect(() => roleName("p".repeat(60), "staging", "replication")).toThrow(TypeError);
  });
});
