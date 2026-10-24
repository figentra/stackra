/**
 * Stackra file contract:
 * Purpose: unit tests of `PickFolderBridge`: a bridge keyed `files.pick_folder` that shows the open-folder dialog over
 *          the focused window, remembers the choice on the app disk per purpose, writes nothing when cancelled, and
 *          refuses a purpose that is not snake_case before any dialog opens.
 * Boundary: test only; Electron is mocked and the disk is the filesystem package's memory driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0251 (decisions 1 to 3); ADR 0234 (decision 7).
 */
import { buildConfig } from "@stackra/config";
import { kindOf } from "@stackra/container";
import type { Clock } from "@stackra/contracts";
import { FilesystemConfig, MemoryFileSystemDriver } from "@stackra/filesystem";
import { beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { PickFolderBridge } from "#electron/bridges/pick-folder.bridge";

const electron = vi.hoisted(() => ({
  showOpenDialog: vi.fn(),
  getFocusedWindow: vi.fn(),
}));

vi.mock("electron", () => ({
  dialog: { showOpenDialog: electron.showOpenDialog },
  BrowserWindow: { getFocusedWindow: electron.getFocusedWindow },
}));

/** A fresh memory disk. */
function disk(): MemoryFileSystemDriver {
  const clock = { now: () => new Date(0) } as unknown as Clock;
  return new MemoryFileSystemDriver(buildConfig(FilesystemConfig), clock);
}

beforeEach(() => {
  electron.showOpenDialog.mockReset();
  electron.getFocusedWindow.mockReset().mockReturnValue(null);
});

describe("PickFolderBridge", () => {
  it("is the platform.files.pick_folder bridge of the files_save capability", () => {
    expect(kindOf(PickFolderBridge)).toEqual({
      kind: "bridge",
      options: { key: "files.pick_folder", capability: "files_save" },
    });
  });

  it("remembers the chosen folder per purpose", async () => {
    const files = disk();
    const parent = { id: 1 };
    electron.getFocusedWindow.mockReturnValue(parent);
    electron.showOpenDialog.mockResolvedValue({
      canceled: false,
      filePaths: ["/Users/a/Receipts"],
    });
    const bridge = new PickFolderBridge(files);
    expect(await bridge.handle({ purpose: "receipt_archive", title: "Pick" })).toEqual({
      path: "/Users/a/Receipts",
    });
    expect(electron.showOpenDialog).toHaveBeenCalledWith(parent, {
      properties: ["openDirectory", "createDirectory"],
      title: "Pick",
    });
    const stored = new TextDecoder().decode(
      await files.read("platform/folders/receipt_archive.json"),
    );
    expect(JSON.parse(stored)).toEqual({ path: "/Users/a/Receipts" });
  });

  it("writes nothing when cancelled", async () => {
    const files = disk();
    electron.showOpenDialog.mockResolvedValue({ canceled: true, filePaths: [] });
    expect(await new PickFolderBridge(files).handle({ purpose: "exports" })).toEqual({
      path: null,
    });
    expect(await files.exists("platform/folders/exports.json")).toBe(false);
  });

  it("refuses a purpose that is not snake_case before any dialog", async () => {
    const bridge = new PickFolderBridge(disk());
    await expect(bridge.handle({ purpose: "../etc" })).rejects.toThrow(TypeError);
    await expect(bridge.handle(null as never)).rejects.toThrow(TypeError);
    expect(electron.showOpenDialog).not.toHaveBeenCalled();
  });
});
