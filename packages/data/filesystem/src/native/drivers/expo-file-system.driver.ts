/**
 * Stackra file contract:
 * Purpose: the Expo (phone) `FileSystem` (`disk: "expo"`): files the app keeps on the device, under its documents
 *          folder at `<documents>/<root>`, through expo-file-system. A shared receipt or a downloaded export lands here.
 * Boundary: device only. Every key stays inside that folder (the shared key check). A write goes to a fresh file in the
 *           app's cache first and is then moved over the key, so a crash never leaves half a file. URLs are the stored
 *           file's `file:` URI: the files are on the person's own phone, so nothing is signed, and the media type is
 *           not kept (`stat().contentType` is `null`). `disk: memory` stays the default, so a target with no
 *           expo-file-system keeps files in memory instead.
 * Runtime: react-native
 * Governing contract: ADR 0478 (decision 2: Expo's own library, no hand-written native code); ADR 0465 (one
 *                     FileSystem port); ADR 0234 (decision 7).
 */
import { Driver } from "@stackra/container";
import type { Duration } from "@stackra/contracts";
import { Directory, File, Paths } from "expo-file-system";

import type { FilesystemConfig } from "#config/filesystem.config";
import { FileSystem } from "#contracts/ports/file-system.port";
import type { FileStat } from "#contracts/types/file-stat.type";
import { FileNotFoundError } from "#core/errors/file-not-found.error";
import { normalizePath } from "#core/functions/normalize-path.function";
import { normalizePrefix } from "#core/functions/normalize-prefix.function";

/**
 * Keeps the app's files on the phone.
 *
 * @example
 * [FileSystem, new ExpoFileSystemDriver(new FilesystemConfig())]
 */
export class ExpoFileSystemDriver extends Driver(FileSystem) {
  /** The folder every key lives under (`<documents>/<root>`). */
  readonly root: Directory;

  /**
   * @param config - the folder under the app's documents folder (`root`).
   */
  constructor(config: FilesystemConfig) {
    super();
    this.root = new Directory(Paths.document, config.root);
  }

  /** Whether a file is stored under `path`. */
  async exists(path: string): Promise<boolean> {
    return this.file(path).exists;
  }

  /** The bytes under `path`. */
  async read(path: string): Promise<Uint8Array> {
    return this.found(path).bytes();
  }

  /** Writes `contents` under `path` through a cache file, never leaving a half-written file. */
  async write(path: string, contents: Uint8Array | string): Promise<void> {
    const target = this.file(path);
    const draft = new File(
      Paths.cache,
      `stackra-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
    );
    draft.create({ overwrite: true });
    try {
      draft.write(contents);
      if (!target.parentDirectory.exists)
        target.parentDirectory.create({ intermediates: true, idempotent: true });
      await draft.move(target, { overwrite: true });
    } catch (error) {
      if (draft.exists) draft.delete();
      throw error;
    }
  }

  /** Removes the file under `path`; false when there was none. */
  async delete(path: string): Promise<boolean> {
    const file = this.file(path);
    if (!file.exists) return false;
    file.delete();
    return true;
  }

  /** Every key starting with `prefix`, sorted. */
  async list(prefix = ""): Promise<string[]> {
    const wanted = normalizePrefix(prefix);
    const keys: string[] = [];
    const walk = (folder: Directory, at: string): void => {
      for (const entry of folder.list())
        if (entry instanceof Directory) walk(entry, `${at}${entry.name}/`);
        else keys.push(`${at}${entry.name}`);
    };
    if (this.root.exists) walk(this.root, "");
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
    return keys.filter((key) => key.startsWith(wanted)).sort();
  }

  /** The size and modification time of the file under `path`. */
  async stat(path: string): Promise<FileStat> {
    const info = this.found(path).info();
    return {
      path: normalizePath(path),
      size: info.size ?? 0,
      lastModified: info.modificationTime === undefined ? null : new Date(info.modificationTime),
      contentType: null,
    };
  }

  /** The `file:` URI of the stored file. */
  url(path: string): string {
    return this.file(path).uri;
  }

  /** The `file:` URI of the stored file; a file on the person's own phone needs no signature. */
  async temporaryUrl(path: string, _expiresIn?: Duration): Promise<string> {
    return this.url(path);
  }

  /** The file a key names, inside the root. */
  private file(path: string): File {
    return new File(this.root, normalizePath(path));
  }

  /** The stored file under `path`, or the not-found refusal. */
  private found(path: string): File {
    const file = this.file(path);
    if (!file.exists) throw FileNotFoundError.create({ path: normalizePath(path) });
    return file;
  }
}
