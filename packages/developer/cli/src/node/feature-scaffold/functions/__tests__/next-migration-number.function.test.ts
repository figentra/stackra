/**
 * Stackra file contract:
 * Purpose: unit tests of `nextMigrationNumber`: `0001` with no folder or no migrations, else one above the highest
 *          numbered migration, ignoring tests and other files.
 * Boundary: test only; writes a throwaway folder in the OS temp directory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0159.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "@stackra/testing";

import { nextMigrationNumber } from "#node/feature-scaffold/functions/next-migration-number.function";

describe(nextMigrationNumber, () => {
  it("counts from the highest numbered migration", () => {
    const folder = mkdtempSync(join(tmpdir(), "stackra-migrations-"));
    try {
      expect(nextMigrationNumber(join(folder, "missing"))).toBe("0001");
      expect(nextMigrationNumber(folder)).toBe("0001");
      mkdirSync(join(folder, "__tests__"));
      for (const file of [
        "0001-create-orders.migration.ts",
        "0009-add-notes.migration.ts",
        "README.md",
      ])
        writeFileSync(join(folder, file), "");
      expect(nextMigrationNumber(folder)).toBe("0010");
    } finally {
      rmSync(folder, { recursive: true, force: true });
    }
  });
});
