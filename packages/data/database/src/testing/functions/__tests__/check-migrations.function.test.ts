/**
 * Stackra file contract:
 * Purpose: unit tests of `checkMigrations`: a folder whose ups, downs and re-applied ups all run passes on a fresh
 *          PGlite; an up that fails, and a down that leaves its up unable to run again, fail naming the file.
 * Boundary: test only; writes compiled-migration folders to a temporary directory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0159; STA-1689.
 */
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "@stackra/testing";

import { checkMigrations } from "#testing/functions/check-migrations.function";

/** A folder holding `files` (name to SQL). */
function folder(files: Readonly<Record<string, string>>): string {
  const directory = mkdtempSync(join(tmpdir(), "stackra-migrations-"));
  for (const [name, sql] of Object.entries(files)) writeFileSync(join(directory, name), sql);
  return directory;
}

/** PGlite's start and extensions alone take seconds; the 5 s default is too short. */
const TIMEOUT_MS = 60_000;

describe("checkMigrations", () => {
  it(
    "applies, reverts and re-applies a sound folder",
    async () => {
      await expect(
        checkMigrations(
          folder({
            "0001_shop_0001_create_items.up.sql":
              "create schema shop;\ncreate table shop.items (id int);\n",
            "0001_shop_0001_create_items.down.sql": "drop table shop.items;\ndrop schema shop;\n",
            "0002_shop_0002_add_name.up.sql": "alter table shop.items add column name text;\n",
            "0002_shop_0002_add_name.down.sql": "alter table shop.items drop column name;\n",
          }),
        ),
      ).resolves.toBeUndefined();
    },
    TIMEOUT_MS,
  );

  it(
    "names an up that fails",
    async () => {
      await expect(
        checkMigrations(
          folder({
            "0001_shop_0001_bad.up.sql": "comment on schema public is 'the model's';\n",
          }),
        ),
      ).rejects.toThrow("0001_shop_0001_bad (up) failed");
    },
    TIMEOUT_MS,
  );

  it(
    "names an up that cannot run again after its down",
    async () => {
      await expect(
        checkMigrations(
          folder({
            "0001_shop_0001_create_items.up.sql": "create table items (id int);\n",
            "0001_shop_0001_create_items.down.sql": "select 1;\n",
          }),
        ),
      ).rejects.toThrow("0001_shop_0001_create_items (up after down) failed");
    },
    TIMEOUT_MS,
  );
});
