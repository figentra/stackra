/**
 * Stackra file contract:
 * Purpose: unit tests of `configKeyOf`: a `ref:` value becomes its stack config key (the first dot is the namespace
 *          separator, later dots stay), and a literal gives `null`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0171 (decision 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { configKeyOf } from "#core/functions/config-key-of.function";

describe("configKeyOf", () => {
  it("turns a ref into its stack config key", () => {
    expect(configKeyOf("ref:expo.projectId")).toBe("expo:projectId");
    expect(configKeyOf("ref:identity.clients.mobile")).toBe("identity:clients.mobile");
    expect(configKeyOf("ref:projectId")).toBe("projectId");
  });

  it("gives null for a literal", () => {
    expect(configKeyOf("acme")).toBeNull();
    expect(configKeyOf("1234567890")).toBeNull();
  });
});
