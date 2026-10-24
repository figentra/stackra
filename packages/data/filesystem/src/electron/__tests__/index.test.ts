/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./electron` entry: `ElectronFileSystem`, which the template's generated
 *          desktop wiring imports (`m.ElectronFileSystem`), is the Electron disk class, also exported under its class
 *          name, and nothing else is exported.
 * Boundary: test only; imports the stand-in barrel through its `#electron` alias, with `electron` replaced by a
 *           stand-in because it does not load in vitest.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, it, vi } from "@stackra/testing";

import { FileSystem } from "#contracts/ports/file-system.port";
import * as electron from "#electron/index";

vi.mock("electron", () => ({ app: { getPath: () => "/tmp/stackra-user-data" } }));

describe("@stackra/filesystem/electron", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(electron).sort()).toEqual([
      "ElectronFileSystem",
      "ElectronFileSystemDriver",
    ]);
  });

  it("exports the template's name for the Electron disk", () => {
    expect(electron.ElectronFileSystem).toBe(electron.ElectronFileSystemDriver);
    expect(electron.ElectronFileSystem.prototype).toBeInstanceOf(FileSystem);
  });
});
