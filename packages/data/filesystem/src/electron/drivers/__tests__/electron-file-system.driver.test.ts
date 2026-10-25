/**
 * Stackra file contract:
 * Purpose: unit tests of `ElectronFileSystemDriver`: a driver of `FileSystem` rooted at `<userData>/<root>`, which
 *          stores, lists and stats files there, keeps keys inside that folder and answers `file:` URLs.
 * Boundary: test only; `electron` does not load in vitest, so `app.getPath` is a stand-in returning a fresh folder
 *           under the OS temporary directory, removed after each test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 4: `vi.mock` from @stackra/testing hoists);
 *                     ADR 0058.
 */
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { buildConfig } from "@stackra/config";
import { kindOf } from "@stackra/container";
import { Duration } from "@stackra/contracts";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";
import { app } from "electron";

import { FilesystemConfig } from "#config/filesystem.config";
import { FileSystem } from "#contracts/ports/file-system.port";
import { FileNotFoundError } from "#core/errors/file-not-found.error";
import { ElectronFileSystemDriver } from "#electron/drivers/electron-file-system.driver";

/** The folder `app.getPath("userData")` answers in this test. */
const userData = vi.hoisted(() => ({ path: "" }));

vi.mock("electron", () => ({ app: { getPath: vi.fn(() => userData.path) } }));

beforeEach(async () => {
  userData.path = await mkdtemp(join(tmpdir(), "stackra-electron-"));
});

afterEach(async () => {
  await rm(userData.path, { recursive: true, force: true });
});

/** An Electron disk with the default root (`storage`). */
function disk(): ElectronFileSystemDriver {
  return new ElectronFileSystemDriver(
    buildConfig(FilesystemConfig, { values: { disk: "electron" } }),
  );
}

describe("ElectronFileSystemDriver", () => {
  it("is a driver of FileSystem rooted under userData", () => {
    const files = disk();
    expect(files).toBeInstanceOf(FileSystem);
    expect(kindOf(ElectronFileSystemDriver)).toEqual({
      kind: "driver",
      options: { port: FileSystem },
    });
    expect(vi.mocked(app.getPath)).toHaveBeenCalledWith("userData");
    expect(files.root).toBe(join(userData.path, "storage"));
  });

  it("stores files under <userData>/<root>", async () => {
    const files = disk();
    await files.write("receipts/r_01.txt", "paid");
    expect(await readFile(join(userData.path, "storage", "receipts", "r_01.txt"), "utf8")).toBe(
      "paid",
    );
    expect(await files.exists("receipts/r_01.txt")).toBe(true);
    expect(new TextDecoder().decode(await files.read("receipts/r_01.txt"))).toBe("paid");
    expect(await files.list("receipts/")).toEqual(["receipts/r_01.txt"]);
    expect(await files.stat("receipts/r_01.txt")).toMatchObject({ size: 4, contentType: null });
    expect(await files.delete("receipts/r_01.txt")).toBe(true);
    await expect(files.read("receipts/r_01.txt")).rejects.toThrow(FileNotFoundError);
  });

  it("keeps every key inside the folder", async () => {
    await expect(disk().write("../outside.txt", "x")).rejects.toThrow(RangeError);
    expect(() => disk().url("../outside.txt")).toThrow(RangeError);
  });

  it("answers file: URLs, signed or not", async () => {
    const files = disk();
    const expected = pathToFileURL(join(userData.path, "storage", "a b.png")).href;
    expect(files.url("a b.png")).toBe(expected);
    expect(await files.temporaryUrl("a b.png", Duration.minutes(1))).toBe(expected);
  });
});
