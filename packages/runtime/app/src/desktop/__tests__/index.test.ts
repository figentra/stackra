/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./desktop` entry: `createApp` (the template's Electron entry imports it)
 *          and `BRIDGE_CHANNEL` are the only values, and `createApp` resolves to a `DesktopApp`.
 * Boundary: test only; imports the stand-in barrel through its `#desktop` alias; `electron` is mocked, since the
 *           entry loads it.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0295 (decision 8); ADR 0127 2026-10-24 note.
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { vi } from "vitest";

import * as desktop from "#desktop/index";
import type { DesktopApp, DesktopAppOptions } from "#desktop/index";

vi.mock("electron", () => ({}));

describe("@stackra/app/desktop", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(desktop).sort()).toEqual(["BRIDGE_CHANNEL", "createApp"]);
  });

  it("resolves createApp to a DesktopApp", () => {
    expectTypeOf(desktop.createApp).parameter(0).toEqualTypeOf<DesktopAppOptions>();
    expectTypeOf(desktop.createApp).returns.resolves.toEqualTypeOf<DesktopApp>();
  });
});
