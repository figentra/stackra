/**
 * Stackra file contract:
 * Purpose: the Electron main-process `FileSystem` (`disk: "electron"`): the desktop app's own files, kept under the
 *          app's `userData` folder, which a package bridge (the folder picker, a receipt archive) reads and writes
 *          behind its port. The desktop wiring binds it as the one `FileSystem` candidate of main.
 * Boundary: main process only; the renderer reaches it through a bridge, never directly. It is the local disk rooted
 *           at `<userData>/<root>`, so every key stays inside that folder. URLs are `file:` URLs of the stored file:
 *           the files are the user's own, on the user's machine, so nothing is signed.
 * Runtime: node
 * Governing contract: ADR 0058 (desktop is Electron); ADR 0127 2026-10-24 note (`./desktop` entry); ADR 0234
 *                     (decision 7); ADR 0294 (decision 16).
 */
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { Driver } from "@stackra/container";
import type { Duration } from "@stackra/contracts";
import { app } from "electron";

import { FilesystemConfig } from "#config/filesystem.config";
import { FileSystem } from "#contracts/ports/file-system.port";
import type { FileStat } from "#contracts/types/file-stat.type";
import { normalizePath } from "#core/functions/normalize-path.function";
import { LocalFileSystemDriver } from "#node/drivers/local-file-system.driver";

/**
 * Keeps the desktop app's files under its `userData` folder.
 *
 * @example
 * // generated .stackra/desktop/wiring.ts
 * { port: FileSystem, candidates: { electron: () => import("@stackra/filesystem/desktop").then((m) => m.ElectronFileSystemDriver) } }
 */
export class ElectronFileSystemDriver extends Driver(FileSystem) {
  private readonly local: LocalFileSystemDriver;

  /** @param config - the folder under `userData` (`root`). */
  constructor(config: FilesystemConfig) {
    super();
    // The local driver reads `root` and `url` only; an absolute root keeps it off the working directory.
    this.local = new LocalFileSystemDriver({
      ...config,
      root: join(app.getPath("userData"), config.root),
    } as FilesystemConfig);
  }

  /** The absolute folder every key lives under (`<userData>/<root>`). */
  get root(): string {
    return this.local.root;
  }

  /** Whether a file is stored under `path`. */
  exists(path: string): Promise<boolean> {
    return this.local.exists(path);
  }

  /** The bytes under `path`. */
  read(path: string): Promise<Uint8Array> {
    return this.local.read(path);
  }

  /** The file under `path` as a stream read from disk in chunks. */
  override readStream(path: string): Promise<ReadableStream<Uint8Array>> {
    return this.local.readStream(path);
  }

  /** Writes `contents` under `path`, never leaving a half-written file. */
  write(path: string, contents: Uint8Array | string): Promise<void> {
    return this.local.write(path, contents);
  }

  /** Removes the file under `path`; false when there was none. */
  delete(path: string): Promise<boolean> {
    return this.local.delete(path);
  }

  /** Every key starting with `prefix`, sorted. */
  list(prefix?: string): Promise<string[]> {
    return this.local.list(prefix);
  }

  /** The size and modification time of the file under `path`. */
  stat(path: string): Promise<FileStat> {
    return this.local.stat(path);
  }

  /** The `file:` URL of the stored file. */
  url(path: string): string {
    return pathToFileURL(join(this.local.root, normalizePath(path))).href;
  }

  /** The `file:` URL of the stored file; a local file on the user's machine needs no signature. */
  async temporaryUrl(path: string, _expiresIn?: Duration): Promise<string> {
    return this.url(path);
  }
}
