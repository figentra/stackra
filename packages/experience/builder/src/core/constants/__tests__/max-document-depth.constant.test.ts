/**
 * Stackra file contract:
 * Purpose: unit test of `MAX_DOCUMENT_DEPTH`: 32 levels, the bound `parseDocumentNode` and the shared reader share.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269.
 */
import { describe, expect, it } from "@stackra/testing";

import { MAX_DOCUMENT_DEPTH } from "#core/constants/max-document-depth.constant";

describe("MAX_DOCUMENT_DEPTH", () => {
  it("allows 32 levels", () => {
    expect(MAX_DOCUMENT_DEPTH).toBe(32);
  });
});
