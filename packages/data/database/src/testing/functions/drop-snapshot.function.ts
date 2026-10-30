/**
 * Stackra file contract:
 * Purpose: `dropSnapshot`, which forgets a snapshot that would not load (a corrupt file) so the next `pgliteSnapshot` builds a fresh one.
 * Boundary: removes the in-process entry and the file; nothing else.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); STA-1685.
 */
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";

import type { MigrationFile } from "#node/types/migration-file.type";
import { PGLITE_SNAPSHOTS } from "#testing/constants/pglite-snapshots.constant";
import { snapshotKey } from "#testing/functions/snapshot-key.function";
import { snapshotPath } from "#testing/functions/snapshot-path.function";

/** Drops the snapshot of `files`. */
export async function dropSnapshot(
  files: readonly MigrationFile[],
  directory: string = tmpdir(),
): Promise<void> {
  const key = snapshotKey(files);
  PGLITE_SNAPSHOTS.delete(key);
  await rm(snapshotPath(directory, key), { force: true });
}
