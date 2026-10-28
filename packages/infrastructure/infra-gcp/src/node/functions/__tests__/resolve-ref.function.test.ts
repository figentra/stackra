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

    expect(resolveRef("europe-west3")).toBe("europe-west3");
  });

  it("reads a plain key and walks a structured one", async () => {
    await mockPulumi({
      billingAccount: "012345-6789AB-CDEF01",
      gcp: { projects: { prod: { id: "acme-prod", number: 123_456_789_012 } } },
    });

    expect(resolveRef("ref:billingAccount")).toBe("012345-6789AB-CDEF01");
    expect(resolveRef("ref:gcp.projects.prod.id")).toBe("acme-prod");
    expect(resolveRef("ref:gcp.projects.prod.number")).toBe("123456789012");
  });

  it("fails on a path the config does not hold", async () => {
    await mockPulumi({ gcp: { projects: {} } });

    expect(() => resolveRef("ref:gcp.projects.prod.id")).toThrow(
      /"projects\.prod\.id" under the stack config key "gcp"/,
    );
    expect(() => resolveRef("ref:billing.account")).toThrow();
  });
});
