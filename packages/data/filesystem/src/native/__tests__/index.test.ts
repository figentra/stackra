/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./native` entry: it exports `ExpoFileSystemDriver`, the phone disk class an
 *          Expo app's wiring imports, under that one name, and nothing else.
 * Boundary: test only; imports the stand-in barrel through its `#native` alias, with `expo-file-system` replaced by a
 *           stand-in because it does not load in vitest.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { FileSystem } from "#contracts/ports/file-system.port";
import * as native from "#native/index";

vi.mock("expo-file-system", () => ({ Directory: class {}, File: class {}, Paths: {} }));

describe("@stackra/filesystem/native", () => {
  it("exports exactly ExpoFileSystemDriver", () => {
    expect(Object.keys(native)).toEqual(["ExpoFileSystemDriver"]);
  });

  it("is a FileSystem", () => {
    expect(native.ExpoFileSystemDriver.prototype).toBeInstanceOf(FileSystem);
  });
});
