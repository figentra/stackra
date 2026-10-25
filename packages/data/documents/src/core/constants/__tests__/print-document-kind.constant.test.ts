/**
 * Stackra file contract:
 * Purpose: unit tests of `PRINT_DOCUMENT_KIND`: the `print` code a template's `kind` carries.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0365.
 */
import { describe, expect, it } from "@stackra/testing";

import { PRINT_DOCUMENT_KIND } from "#core/constants/print-document-kind.constant";

describe("PRINT_DOCUMENT_KIND", () => {
  it("is print", () => {
    expect(PRINT_DOCUMENT_KIND).toBe("print");
  });
});
