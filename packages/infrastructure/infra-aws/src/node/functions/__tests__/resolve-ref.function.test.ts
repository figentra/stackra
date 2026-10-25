/**
 * Stackra file contract:
 * Purpose: unit tests of `resolveRef`: a literal passes through; `ref:<key>` reads a plain config value and
 *          `ref:<key>.<path>` walks a structured one; a number becomes its string; a missing path fails naming it.
 * Boundary: test only; the stack config is installed by `mockPulumi`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0171 (decision 4: `ref:` values from the stacks repository).
 */
import { describe, expect, it } from "@stackra/testing";

import { resolveRef } from "#node/functions/resolve-ref.function";
import { mockPulumi } from "#testing/functions/mock-pulumi.function";

describe("resolveRef", () => {
  it("passes a literal through", async () => {
    await mockPulumi();

    expect(resolveRef("me-central-1")).toBe("me-central-1");
  });

  it("reads a plain key and walks a structured one", async () => {
    await mockPulumi({
      workspace: "ws-1",
      aws: { accounts: { prod: "123456789012" }, budgets: { prod: 2000 } },
    });

    expect(resolveRef("ref:workspace")).toBe("ws-1");
    expect(resolveRef("ref:aws.accounts.prod")).toBe("123456789012");
    expect(resolveRef("ref:aws.budgets.prod")).toBe("2000");
  });

  it("fails on a path the config does not hold", async () => {
    await mockPulumi({ aws: { accounts: {} } });

    expect(() => resolveRef("ref:aws.accounts.prod")).toThrow(
      /"accounts\.prod" under the stack config key "aws"/,
    );
    expect(() => resolveRef("ref:encore.externalId")).toThrow();
  });
});
