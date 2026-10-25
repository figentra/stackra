/**
 * Stackra file contract:
 * Purpose: `PickFolderBridge` (`platform.files.pick_folder`), the folder picker behind the `FileSystem` port: main
 *          shows the native open-folder dialog and remembers the chosen path on the app's own disk under
 *          `platform/folders/<purpose>.json`, where another bridge (a receipt archive, an export) reads it later.
 * Boundary: main process only. The input comes from the renderer, so the purpose is checked (snake_case) before the
 *           dialog opens; a cancelled dialog writes nothing and answers `{ path: null }`. Electron is loaded when the
 *           bridge runs, so the renderer can load this entry for its driver without bundling main-process modules.
 * Runtime: node
 * Governing contract: ADR 0251 (decisions 1 to 3, as amended by 0294); ADR 0234 (decision 7: files through the
 *                     FileSystem port); registry A13.
 */
import { FileSystem } from "@stackra/filesystem/contracts";
import type { OpenDialogOptions } from "electron";

import { Capability } from "#core/enums/capability.enum";
import { Bridge } from "#desktop/bases/bridge.base";
import type { PickFolderInput } from "#desktop/types/pick-folder-input.type";
import type { PickFolderOutput } from "#desktop/types/pick-folder-output.type";

/** A purpose: snake_case. */
const PURPOSE = /^[a-z][a-z0-9_]*$/;

/**
 * Picks a folder and remembers it per purpose.
 *
 * @example
 * // renderer, through the generated preload
 * const { path } = await window.stackra.invoke("platform.files.pick_folder", { purpose: "receipt_archive" });
 */
export class PickFolderBridge extends Bridge({
  key: "files.pick_folder",
  capability: Capability.FilesSave,
}) {
  /** The app's own disk (`ElectronFileSystemDriver`). */
  private readonly files: FileSystem;

  /** @param files - the app's own disk, where the chosen path is remembered. */
  constructor(files: FileSystem) {
    super();
    this.files = files;
  }

  /**
   * Shows the dialog over the focused window and remembers the choice.
   *
   * @throws TypeError when the purpose is not snake_case or the title is not a string.
   */
  async handle(input: PickFolderInput): Promise<PickFolderOutput> {
    const { purpose, title } = (input ?? {}) as Partial<PickFolderInput>;
    if (typeof purpose !== "string" || !PURPOSE.test(purpose))
      throw new TypeError("pick_folder needs a snake_case purpose");
    if (title !== undefined && typeof title !== "string")
      throw new TypeError("pick_folder takes a string title");
    const { BrowserWindow, dialog } = await import("electron");
    const options: OpenDialogOptions = {
      properties: ["openDirectory", "createDirectory"],
      ...(title === undefined ? {} : { title }),
    };
    const parent = BrowserWindow.getFocusedWindow();
    const result = await (parent === null
      ? dialog.showOpenDialog(options)
      : dialog.showOpenDialog(parent, options));
    const path = result.canceled ? null : (result.filePaths[0] ?? null);
    if (path !== null)
      await this.files.write(`platform/folders/${purpose}.json`, JSON.stringify({ path }));
    return { path };
  }
}
