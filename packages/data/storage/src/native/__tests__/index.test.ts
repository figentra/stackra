/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./native` entry: it exports `NativeStorageDriver`, the mobile candidate gen
 *          lists for the `Storage` port, and nothing else.
 * Boundary: test only; the two native modules are mocked, so no device is needed.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 15); ADR 0127 2026-10-24 note.
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

vi.mock("react-native-mmkv", () => ({ createMMKV: vi.fn() }));
vi.mock("expo-secure-store", () => ({}));

import * as native from "#native/index";

describe("@stackra/storage/native", () => {
  it("exports exactly NativeStorageDriver", () => {
    expect(Object.keys(native)).toEqual(["NativeStorageDriver"]);
  });
});
