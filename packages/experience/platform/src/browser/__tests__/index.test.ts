/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./browser` entry: it exports the web platform and web push drivers and
 *          nothing else.
 * Boundary: test only; imports the stand-in barrel through its `#browser` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 15); ADR 0127 2026-10-24 note.
 */
import { describe, expect, it } from "@stackra/testing";

import * as browser from "#browser/index";

describe("@stackra/platform/browser", () => {
  it("exports exactly the two web drivers", () => {
    expect(Object.keys(browser).sort()).toEqual(["WebPlatformDriver", "WebPushTransportDriver"]);
  });
});
