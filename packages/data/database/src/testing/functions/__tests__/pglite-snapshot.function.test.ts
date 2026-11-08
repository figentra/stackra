/**
 * Stackra file contract:
 * Purpose: unit tests of `pgliteSnapshot`: a second request for the same migrations set runs no initdb or migration
 *          (counter), a cold process reads the file instead, two PGlites started from one snapshot are independent,
 *          and a changed migrations set builds a new snapshot.
 * Boundary: unit tier: PGlite runs in this process; the snapshot file goes to a temp folder made here.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 3); STA-1685.
 */
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { PGlite } from "@electric-sql/pglite";
import { afterAll, describe, expect, it } from "@stackra/testing";

import type { MigrationFile } from "#node/types/migration-file.type";
import { PGLITE_BOOTSTRAPS } from "#testing/constants/pglite-bootstraps.constant";
import { PGLITE_SNAPSHOTS } from "#testing/constants/pglite-snapshots.constant";
import { loadPglitePeers } from "#testing/functions/load-pglite-peers.function";
import { pgliteSnapshot } from "#testing/functions/pglite-snapshot.function";
import { snapshotKey } from "#testing/functions/snapshot-key.function";

const directory = mkdtempSync(join(tmpdir(), "stackra-snapshot-test-"));

afterAll(() => rmSync(directory, { recursive: true, force: true }));

/** A one-statement migration file. */
const file = (name: string, sql: string): MigrationFile => ({
  version: 1,
  name,
  batch: name,
  transactional: true,
  timeout: undefined,
  sql,
  checksum: "",
  legacyChecksum: "",
  inverse: undefined,
});

const notes = [file("0001_notes", "create table notes (body text);")];

/** A PGlite started from the snapshot of `files`. */
async function startFrom(files: readonly MigrationFile[]): Promise<PGlite> {
  const { PGlite, extensions } = loadPglitePeers();
  return PGlite.create({
    extensions,
    loadDataDir: await pgliteSnapshot(files, directory),
  });
}

describe("pgliteSnapshot", { timeout: 120_000 }, () => {
  it("builds once per migrations set, then reuses the snapshot and the file", async () => {
    const before = PGLITE_BOOTSTRAPS.count;
    await pgliteSnapshot(notes, directory);
    expect(PGLITE_BOOTSTRAPS.count).toBe(before + 1);
    await pgliteSnapshot(notes, directory);
    expect(PGLITE_BOOTSTRAPS.count).toBe(before + 1);
    // A cold process has no in-memory snapshot but finds the file.
    PGLITE_SNAPSHOTS.clear();
    await pgliteSnapshot(notes, directory);
    expect(PGLITE_BOOTSTRAPS.count).toBe(before + 1);
  });

  it("starts independent databases that both hold the migrated schema", async () => {
    const first = await startFrom(notes);
    const second = await startFrom(notes);
    try {
      await first.exec("insert into notes (body) values ('only in first');");
      expect((await first.query("select body from notes")).rows).toHaveLength(1);
      expect((await second.query("select body from notes")).rows).toHaveLength(0);
    } finally {
      await first.close();
      await second.close();
    }
  });

  it("builds a new snapshot when the migrations change", async () => {
    const changed = [file("0001_notes", "create table notes (body text, extra int);")];
    expect(snapshotKey(changed)).not.toBe(snapshotKey(notes));
    const before = PGLITE_BOOTSTRAPS.count;
    const database = await startFrom(changed);
    try {
      expect(PGLITE_BOOTSTRAPS.count).toBe(before + 1);
      await database.exec("insert into notes (body, extra) values ('x', 1);");
    } finally {
      await database.close();
    }
  });
});
