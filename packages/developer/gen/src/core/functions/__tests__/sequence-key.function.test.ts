/**
 * Stackra file contract:
 * Purpose: unit tests of `sequenceKey`: `<module>.` + the written key.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0342 (decision 1).
 */
import { describe, expect, it } from "@stackra/testing";

import { sequenceKey } from "#core/functions/sequence-key.function";

describe("sequenceKey", () => {
  it("prefixes the written key with the module", () => {
    expect(sequenceKey("billing", "invoice")).toBe("billing.invoice");
    expect(sequenceKey("billing", "credit.note")).toBe("billing.credit.note");
  });
});
