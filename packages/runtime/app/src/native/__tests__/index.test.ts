/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./native` entry: `createApp` (the template's mobile entry imports it) is the
 *          only value, and it returns a `NativeApp` synchronously.
 * Boundary: test only; imports the stand-in barrel through its `#native` alias; react-native and expo-splash-screen
 *           are mocked, since the entry loads them.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0295 (decision 8).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { vi } from "vitest";

import * as native from "#native/index";
import type { NativeApp } from "#native/index";

vi.mock("expo-splash-screen", () => ({ preventAutoHideAsync: vi.fn(), hideAsync: vi.fn() }));
vi.mock("react-native", () => ({ I18nManager: { allowRTL: vi.fn(), forceRTL: vi.fn() } }));

describe("@stackra/app/native", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(native)).toEqual(["createApp"]);
  });

  it("returns a NativeApp synchronously", () => {
    expectTypeOf(native.createApp).returns.toEqualTypeOf<NativeApp>();
  });
});
