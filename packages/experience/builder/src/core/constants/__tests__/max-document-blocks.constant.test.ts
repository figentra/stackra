/**
 * Stackra file contract:
 * Purpose: unit test of `MAX_DOCUMENT_BLOCKS`: 10,000 blocks per document, the root included.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269.
 */
import { describe, expect, it } from "@stackra/testing";

import { MAX_DOCUMENT_BLOCKS } from "#core/constants/max-document-blocks.constant";

describe("MAX_DOCUMENT_BLOCKS", () => {
  it("allows 10,000 blocks", () => {
    expect(MAX_DOCUMENT_BLOCKS).toBe(10_000);
  });
});
