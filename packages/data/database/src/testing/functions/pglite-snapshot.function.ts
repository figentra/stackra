/**
 * Stackra file contract:
 * Purpose: `pgliteSnapshot`, the data directory of a PGlite that has run initdb, the approved extensions and a
 *          member's migrations, as a `Blob` each test database starts from (`new PGlite({ loadDataDir })`) instead of
 *          booting from scratch. Kept per process in `PGLITE_SNAPSHOTS` and in a file under the temp folder, so the
 *          vitest worker processes of one run (isolate on) share one build.
 * Boundary: the key is a SHA-256 of the migration files (name and SQL), the PGlite build path and the extension list,
 *           so another migrations set never reads a stale snapshot. A file is written under a temporary name and
 *           renamed, so a reader never sees a half-written one; a missing or empty file means a fresh build.
 *           The snapshot is bytes: every driver instance starts its own PGlite from it and shares no state.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); STA-1685.
 */
import { randomUUID } from "node:crypto";
import { readFile, rename, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";

import type { MigrationFile } from "#node/types/migration-file.type";
import { PGLITE_BOOTSTRAPS } from "#testing/constants/pglite-bootstraps.constant";
import { PGLITE_SNAPSHOTS } from "#testing/constants/pglite-snapshots.constant";
import { bootstrapPglite } from "#testing/functions/bootstrap-pglite.function";
import { loadPglitePeers } from "#testing/functions/load-pglite-peers.function";
import { snapshotKey } from "#testing/functions/snapshot-key.function";
import { snapshotPath } from "#testing/functions/snapshot-path.function";

/** The mime type PGlite reads an uncompressed data directory by. */
const TAR = "application/x-tar";

/** Reads the snapshot file, or undefined when it is missing or empty. */
async function readSnapshot(path: string): Promise<Blob | undefined> {
  try {
    const bytes = await readFile(path);
    return bytes.length === 0 ? undefined : new Blob([bytes], { type: TAR });
  } catch {
    return undefined;
  }
}

/** Boots a PGlite from scratch, migrates it, dumps its data directory and writes the file atomically. */
async function buildSnapshot(files: readonly MigrationFile[], path: string): Promise<Blob> {
  PGLITE_BOOTSTRAPS.count += 1;
  const { PGlite, extensions } = loadPglitePeers();
  const pglite = await PGlite.create({ extensions });
  try {
    await bootstrapPglite(pglite, files);
    const dump = await pglite.dumpDataDir("none");
    const bytes = Buffer.from(await dump.arrayBuffer());
    const temporary = `${path}.${process.pid}.${randomUUID()}.tmp`;
    try {
      await writeFile(temporary, bytes);
      await rename(temporary, path);
    } catch {
      // The temp folder is only a cache: a failed write leaves the in-process snapshot, which is enough.
    }
    return new Blob([bytes], { type: TAR });
  } finally {
    await pglite.close();
  }
}

/**
 * The snapshot for `files`: from this process, else from the file, else built (and written).
 *
 * @param directory - where the snapshot file lives; the OS temp folder by default.
 * @example
 * const loadDataDir = await pgliteSnapshot(readMigrationFiles(".stackra/migrations"));
 */
export function pgliteSnapshot(
  files: readonly MigrationFile[],
  directory: string = tmpdir(),
): Promise<Blob> {
  const key = snapshotKey(files);
  let snapshot = PGLITE_SNAPSHOTS.get(key);
  if (snapshot === undefined) {
    const path = snapshotPath(directory, key);
    snapshot = readSnapshot(path).then((found) => found ?? buildSnapshot(files, path));
    PGLITE_SNAPSHOTS.set(key, snapshot);
    // A failed build is not kept, so the next test tries again.
    snapshot.catch(() => PGLITE_SNAPSHOTS.delete(key));
  }
  return snapshot;
}
