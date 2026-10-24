/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./browser` entry: it exports `WebStorageDriver`, the web and PWA candidate gen
 *          lists for the `Storage` port, and nothing else.
 * Boundary: test only; imports the stand-in barrel through its `#browser` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 15); ADR 0127 2026-10-24 note.
 */
import { describe, expect, it } from "@stackra/testing";

import * as browser from "#browser/index";

describe("@stackra/storage/browser", () => {
  it("exports exactly WebStorageDriver", () => {
    expect(Object.keys(browser)).toEqual(["WebStorageDriver"]);
  });
});
