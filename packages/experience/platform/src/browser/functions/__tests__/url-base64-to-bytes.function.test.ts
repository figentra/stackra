/**
 * Stackra file contract:
 * Purpose: unit tests of `urlBase64ToBytes`: URL-safe base64 without padding decodes to its bytes.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0255 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { urlBase64ToBytes } from "#browser/functions/url-base64-to-bytes.function";

describe("urlBase64ToBytes", () => {
  it("decodes URL-safe base64 without padding", () => {
    expect([...urlBase64ToBytes("AQAB")]).toEqual([1, 0, 1]);
    expect([...urlBase64ToBytes("-_8")]).toEqual([251, 255]);
  });
});
