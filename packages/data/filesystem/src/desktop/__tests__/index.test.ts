/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./desktop` entry: it exports `ElectronFileSystemDriver`, the Electron disk
 *          class the template's generated desktop wiring imports, under that one name, and nothing else.
 * Boundary: test only; imports the stand-in barrel through its `#desktop` alias, with `electron` replaced by a
 *           stand-in because it does not load in vitest.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { FileSystem } from "#contracts/ports/file-system.port";
import * as desktop from "#desktop/index";

vi.mock("electron", () => ({ app: { getPath: () => "/tmp/stackra-user-data" } }));

describe("@stackra/filesystem/desktop", () => {
  it("exports exactly ElectronFileSystemDriver", () => {
    expect(Object.keys(desktop)).toEqual(["ElectronFileSystemDriver"]);
  });

  it("is a FileSystem", () => {
    expect(desktop.ElectronFileSystemDriver.prototype).toBeInstanceOf(FileSystem);
  });
});
