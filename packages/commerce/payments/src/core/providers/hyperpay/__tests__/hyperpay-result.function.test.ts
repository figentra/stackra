/**
 * Stackra file contract:
 * Purpose: unit tests of `hyperpayResult`: OPPWA success, review, pending and failure codes.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269.
 */
import { describe, expect, it } from "@stackra/testing";

import { hyperpayResult } from "#core/providers/hyperpay/hyperpay-result.function";

describe("hyperpayResult", () => {
  it("classifies result codes", () => {
    expect(hyperpayResult("000.000.000")).toBe("success");
    expect(hyperpayResult("000.100.110")).toBe("success");
    expect(hyperpayResult("000.400.000")).toBe("success");
    expect(hyperpayResult("000.200.000")).toBe("pending");
    expect(hyperpayResult("800.400.500")).toBe("pending");
    expect(hyperpayResult("800.100.151")).toBe("failed");
  });
});
