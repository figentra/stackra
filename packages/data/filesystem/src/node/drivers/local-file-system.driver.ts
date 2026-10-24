/**
 * Stackra file contract:
 * Purpose: the local `FileSystem` (`disk: "local"`): files in a folder on this machine, for dev and single-host
 *          installs. Public files are served by whatever serves `filesystem.url`.
 * Boundary: every key passes `normalizePath`, so no key reaches outside `root`. A write goes to a temporary file in
 *           the same folder and is renamed into place, so a crash never leaves a half-written file under the key. It
 *           keeps no content type and cannot sign URLs.
 * Runtime: node
 * Governing contract: ADR 0234 (decision 7); ADR 0222 (decision 1: local disk driver); ADR 0294 (decision 16).
 */
import { randomUUID } from "node:crypto";
import { mkdir, readdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";

import { Driver } from "@stackra/container";
import type { Duration } from "@stackra/contracts";

import { FilesystemConfig } from "#config/filesystem.config";
import { FileSystem } from "#contracts/ports/file-system.port";
import type { FileStat } from "#contracts/types/file-stat.type";
import type { WriteOptions } from "#contracts/types/write-options.type";
import { FileNotFoundError } from "#core/errors/file-not-found.error";
import { normalizePath } from "#core/functions/normalize-path.function";
import { normalizePrefix } from "#core/functions/normalize-prefix.function";
import { publicUrl } from "#core/functions/public-url.function";

/** Whether `error` says the path, or a folder on it, does not exist. */
function isMissing(error: unknown): boolean {
  const code = (error as { code?: unknown } | null)?.code;
  return code === "ENOENT" || code === "ENOTDIR";
}

/**
 * Keeps files in a local folder.
 *
 * @example
 * // runway.yaml (dev): config.filesystem.disk: local
 * await files.write("exports/orders.csv", csv);
 */
export class LocalFileSystemDriver extends Driver(FileSystem) {
  /** The absolute folder every key lives under. */
  readonly root: string;

  private readonly base: string | null;

  /** @param config - the folder (`root`, resolved against the working directory) and the public base URL (`url`). */
  constructor(config: FilesystemConfig) {
    super();
    this.root = resolve(config.root);
    this.base = config.url;
  }

  /** Whether a file (not a folder) is stored under `path`. */
  async exists(path: string): Promise<boolean> {
    try {
      return (await stat(this.pathOf(path))).isFile();
    } catch (error) {
      if (isMissing(error)) return false;
      throw error;
    }
  }

  /** The bytes under `path`. */
  async read(path: string): Promise<Uint8Array> {
    const key = normalizePath(path);
    try {
      return new Uint8Array(await readFile(join(this.root, key)));
    } catch (error) {
      if (isMissing(error) || (error as { code?: unknown }).code === "EISDIR")
        throw new FileNotFoundError(key);
      throw error;
    }
  }

  /** Writes `contents` to a temporary file beside the target, then renames it into place; no content type is kept. */
  async write(path: string, contents: Uint8Array | string, _options?: WriteOptions): Promise<void> {
    const target = this.pathOf(path);
    await mkdir(dirname(target), { recursive: true });
    const temporary = `${target}.${randomUUID()}.tmp`;
    try {
      await writeFile(temporary, contents);
      await rename(temporary, target);
    } catch (error) {
      await rm(temporary, { force: true });
      throw error;
    }
  }

  /** Removes the file under `path`; false when there was none. */
  async delete(path: string): Promise<boolean> {
    if (!(await this.exists(path))) return false;
    await rm(this.pathOf(path));
    return true;
  }

  /** Every file key under `root` starting with `prefix`, sorted; a missing root lists nothing. */
  async list(prefix = ""): Promise<string[]> {
    const wanted = normalizePrefix(prefix);
    const folder = wanted.slice(0, Math.max(wanted.lastIndexOf("/"), 0));
    try {
      const entries = await readdir(join(this.root, folder), {
        recursive: true,
        withFileTypes: true,
      });
      return entries
        .filter((entry) => entry.isFile())
        .map((entry) =>
          relative(this.root, join(entry.parentPath, entry.name)).split(sep).join("/"),
        )
        .filter((key) => key.startsWith(wanted))
        .sort();
    } catch (error) {
      if (isMissing(error)) return [];
      throw error;
    }
  }

  /** The size and modification time of the file under `path`; no content type. */
  async stat(path: string): Promise<FileStat> {
    const key = normalizePath(path);
    try {
      const facts = await stat(join(this.root, key));
      if (!facts.isFile()) throw new FileNotFoundError(key);
      return { path: key, size: facts.size, lastModified: facts.mtime, contentType: null };
    } catch (error) {
      if (isMissing(error)) throw new FileNotFoundError(key);
      throw error;
    }
  }

  /** The configured base URL followed by the key. */
  url(path: string): string {
    return publicUrl(this.base, path);
  }

  /**
   * Refuses: a local folder has nothing that checks a signature.
   *
   * @throws Error always.
   */
  async temporaryUrl(path: string, _expiresIn?: Duration): Promise<string> {
    normalizePath(path);
    throw new Error("The local disk cannot sign URLs: use url() for public files or a bucket disk");
  }

  /** The absolute path of a key. */
  private pathOf(path: string): string {
    return join(this.root, normalizePath(path));
  }
}
