/**
 * Stackra file contract:
 * Purpose: unit tests of `readMigrationFiles`: sequence order, the non-transactional marker, the inverse, the batch
 *          name, the step timeout header, the checksum, and the failures.
 * Boundary: test only; each case writes a throwaway folder.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0159.
 */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "@stackra/testing";

import { readMigrationFiles } from "#node/functions/read-migration-files.function";

const roots: string[] = [];

afterEach(() => {
  for (const folder of roots.splice(0)) rmSync(folder, { recursive: true, force: true });
});

/** A folder holding the given files. */
function makeFolder(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), "stackra-db-files-"));
  roots.push(root);
  for (const [name, text] of Object.entries(files)) writeFileSync(join(root, name), text);
  return root;
}

describe("readMigrationFiles", () => {
  it("orders by sequence, reads the marker and the inverse, and names the batch", () => {
    const root = makeFolder({
      "0002_orders_0001_index_2.up.sql":
        "-- stackra:transactional=false\ncreate index concurrently i on t (a)",
      "0001_orders_0001_index_1.up.sql": "alter table t add column a int",
      "0001_orders_0001_index_1.down.sql": "alter table t drop column a",
      "notes.txt": "ignored",
    });
    const files = readMigrationFiles(root);
    expect(files.map((file) => file.version)).toEqual([1, 2]);
    expect(files.map((file) => file.transactional)).toEqual([true, false]);
    expect(files[0]?.inverse).toBe("alter table t drop column a");
    expect(files[1]?.inverse).toBeUndefined();
    expect(files.map((file) => file.batch)).toEqual(["orders_0001_index", "orders_0001_index"]);
  });

  it("reads a step timeout from the leading header lines only, and a checksum of the text", () => {
    const root = makeFolder({
      "0001_a.up.sql":
        "-- stackra:transactional=false\n-- stackra:timeout=30min\ncreate index concurrently i on t (a)",
      "0002_b.up.sql": "select 1;\n-- stackra:timeout=1h",
    });
    const files = readMigrationFiles(root);
    expect(files.map((file) => file.timeout)).toEqual(["30min", undefined]);
    expect(files[0]?.checksum).toMatch(/^[\da-f]{64}$/);
    expect(files[0]?.checksum).not.toBe(files[1]?.checksum);
  });

  it("fails for a missing folder and for a repeated sequence", () => {
    expect(() => readMigrationFiles(join(tmpdir(), "stackra-db-files-missing"))).toThrow(
      "stackra gen",
    );
    const root = makeFolder({ "0001_a.up.sql": "select 1", "0001_b.up.sql": "select 2" });
    expect(() => readMigrationFiles(root)).toThrow("share sequence 1");
  });
});
