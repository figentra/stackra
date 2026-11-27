/**
 * Stackra file contract:
 * Purpose: the `file` driver of the `SecretStore` port: `load()` reads one file per secret from the folder the
 *          platform mounts its secrets in (a Kubernetes Secret volume, Docker or Compose secrets, a systemd credential
 *          directory), named by the secret (`/run/secrets/RESEND_API_KEY`), and keeps them in memory; `get(name)`
 *          answers from that copy. One trailing line break is dropped from each file.
 * Boundary: server only. `get` is synchronous by the port's contract, so the runtime awaits `load()` at boot; a `get`
 *           before the first load throws. A load swaps the copy only when every file was read, so a failed reload
 *           keeps the last good values. Values live in a private map, are never listed, logged or put in an error: a
 *           failed load names the folder, the names and an errno code, never a value. With no `names`, only
 *           SCREAMING_SNAKE regular files are read, so the platform's own entries (`..data`, dotfiles) are skipped. A
 *           file over 64 KiB is refused. Kubernetes swaps a mounted Secret's files in place, so a reload
 *           (`scheduleSecretReload`) picks up a rotation with no restart.
 * Runtime: node
 * Governing contract: ADR 0371 (amendment 2026-11-27, STA-258: on-premises and air-gapped stores); ADR 0173 (nobody
 *                     reads a value; secrets by name); ADR 0294 (decision 16).
 */
import { readdir, readFile, stat } from "node:fs/promises";
import { isAbsolute, join } from "node:path";

import { Driver } from "@stackra/container";

import type { SecretFilesConfig } from "#config/secret-files.config";
import { SecretStore } from "#contracts/ports/secret-store.port";

/** A secret name, which is also its file's name. */
const NAME = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$/;

/** The largest secret file read: 64 KiB. */
const MAX_BYTES = 64 * 1024;

/** The errno code of a file-system failure, never its message (which could quote a path's content). */
const codeOf = (error: unknown): string =>
  typeof (error as { code?: unknown } | null)?.code === "string"
    ? String((error as { code: string }).code)
    : "unreadable";

/**
 * Reads secrets from mounted files.
 *
 * @example
 * const store = new FileSecretStoreDriver(buildConfig(SecretFilesConfig, { values: { directory: "/run/secrets" } }));
 * await store.load();
 */
export class FileSecretStoreDriver extends Driver(SecretStore) {
  private readonly config: SecretFilesConfig;

  private values: ReadonlyMap<string, string> | undefined;

  /**
   * @param config - the folder and the names it must hold.
   */
  constructor(config: SecretFilesConfig) {
    super();
    this.config = config;
  }

  /**
   * Reads every secret file, replacing what an earlier load read only when all of them were read.
   *
   * @throws Error when the folder is not an absolute path or cannot be listed, or a named file is missing, not a
   *         file, unreadable or over 64 KiB (names and codes only, no value).
   */
  async load(): Promise<void> {
    const { directory, names } = this.config;
    if (directory === "" || !isAbsolute(directory))
      throw new Error("The file secret store needs an absolute directory");
    const listed = names.length === 0;
    let wanted: readonly string[] = names;
    if (listed) {
      try {
        wanted = (await readdir(directory)).filter((name) => NAME.test(name)).toSorted();
      } catch (error) {
        throw new Error(`The file secret store cannot list ${directory} (${codeOf(error)})`, {
          cause: error,
        });
      }
    }
    const values = new Map<string, string>();
    const failed: string[] = [];
    for (const name of wanted) {
      const path = join(directory, name);
      try {
        // oxlint-disable-next-line no-await-in-loop -- a handful of small files, read one after the other
        const info = await stat(path);
        if (!info.isFile()) {
          // A listed folder may hold the platform's own folders; a named secret must be a file.
          if (!listed) failed.push(`${name} (not a file)`);
          continue;
        }
        if (info.size > MAX_BYTES) {
          failed.push(`${name} (over ${MAX_BYTES} bytes)`);
          continue;
        }
        // oxlint-disable-next-line no-await-in-loop -- as above
        const text = await readFile(path, "utf8");
        values.set(name, text.replace(/\r?\n$/, ""));
      } catch (error) {
        const code = codeOf(error);
        failed.push(`${name} (${code === "ENOENT" ? "missing" : code})`);
      }
    }
    if (failed.length > 0)
      throw new Error(`The file secret store could not read in ${directory}: ${failed.join(", ")}`);
    this.values = values;
  }

  /**
   * See `SecretStore.get`: the loaded value of `name`, or `undefined` when the folder has none.
   *
   * @throws Error before the first `load`.
   */
  get(name: string): string | undefined {
    if (this.values === undefined)
      throw new Error("The file secret store is not loaded: await store.load() at boot");
    return this.values.get(name);
  }
}
