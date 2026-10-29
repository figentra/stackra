/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./native` entry: the Expo driver, nothing else.
 * Boundary: test only; `expo` is mocked so the entry loads off a device.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import * as native from "#native/index";

vi.mock("expo", () => ({ requireOptionalNativeModule: () => null }));

describe("@stackra/native-spotlight/native", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(native).sort()).toEqual(["ExpoDeviceSearchIndexDriver"]);
  });
});
