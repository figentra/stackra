/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./desktop` entry: it exports exactly `ElectronSignInBrowserDriver`.
 * Boundary: test only; `electron` is replaced by a stand-in so the barrel loads under node.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import * as desktop from "#desktop/index";

vi.mock("electron", () => ({ shell: { openExternal: vi.fn() } }));

describe("@stackra/identity/desktop", () => {
  it("exports exactly the Electron sign-in browser", () => {
    expect(Object.keys(desktop)).toEqual(["ElectronSignInBrowserDriver"]);
  });
});
