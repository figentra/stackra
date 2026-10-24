/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./electron` entry: `createApp` (the template's Electron entry imports it)
 *          and `BRIDGE_CHANNEL` are the only values, and `createApp` resolves to a `DesktopApp`.
 * Boundary: test only; imports the stand-in barrel through its `#electron` alias; `electron` is mocked, since the
 *           entry loads it.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0295 (decision 8); ADR 0127 2026-10-24 note.
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { vi } from "vitest";

import * as electron from "#electron/index";
import type { DesktopApp, DesktopAppOptions } from "#electron/index";

vi.mock("electron", () => ({}));

describe("@stackra/app/electron", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(electron).sort()).toEqual(["BRIDGE_CHANNEL", "createApp"]);
  });

  it("resolves createApp to a DesktopApp", () => {
    expectTypeOf(electron.createApp).parameter(0).toEqualTypeOf<DesktopAppOptions>();
    expectTypeOf(electron.createApp).returns.resolves.toEqualTypeOf<DesktopApp>();
  });
});
