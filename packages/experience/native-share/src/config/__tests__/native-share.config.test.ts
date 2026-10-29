/**
 * Stackra file contract:
 * Purpose: unit tests of `NativeShareConfig` and its shipped schema: the defaults (text, links, photos and PDFs, ten
 *          items of 25 MB) and the refusal of a malformed media type.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 26).
 */
import { describe, expect, it } from "@stackra/testing";

import { NativeShareConfig } from "#config/native-share.config";
import { NATIVE_SHARE_CONFIG_SCHEMA } from "#core/constants/native-share-config-schema.constant";

describe("NativeShareConfig", () => {
  it("takes text, links, photos and PDFs by default", () => {
    const config = new NativeShareConfig();
    expect(config.text).toBe(true);
    expect(config.links).toBe(true);
    expect(config.fileTypes).toEqual(["image/*", "application/pdf"]);
    expect(config.maxItems).toBe(10);
    expect(config.maxBytes).toBe(25_000_000);
  });

  it("ships a schema whose defaults match and which refuses a malformed type", () => {
    expect(NATIVE_SHARE_CONFIG_SCHEMA.parse({}).fileTypes).toEqual(["image/*", "application/pdf"]);
    expect(NATIVE_SHARE_CONFIG_SCHEMA.safeParse({ fileTypes: ["pdf"] }).success).toBe(false);
  });
});
