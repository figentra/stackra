/**
 * Stackra file contract:
 * Purpose: unit tests of `checkMigrationLock`: a lock every unit matches passes, and so does a migration the lock does
 *          not name (still editable); a locked migration that compiles to other SQL is `migration_locked_changed`, one
 *          that is gone is `migration_locked_missing`, and a locked migration after its module's unlocked previous one
 *          or after an unlocked `after` id is `migration_lock_gap`.
 * Boundary: test only; units and locks are built inline.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0159 (2026-10-23 note: the SHA-256 lock); STA-2160.
 */
import { describe, expect, it } from "@stackra/testing";

import { checkMigrationLock } from "#core/functions/check-migration-lock.function";
import type { LockedMigration } from "#core/types/locked-migration.type";
import type { MigrationUnit } from "#core/types/migration-unit.type";

/** A 64-character hex SHA-256 made of one repeated digit. */
const sha = (digit: string): string => digit.repeat(64);

/** A one-step unit with `sha256`. */
const unit = (id: string, sha256: string, after: readonly string[] = []): MigrationUnit => ({
  id,
  owner: "member",
  file: `src/modules/${id.slice(0, id.indexOf("."))}/database/migrations/${id}.migration.ts`,
  after,
  needs: [],
  steps: [{ sql: [`select '${id}'`], transactional: true, inverse: [] }],
  sha256,
});

/** The lock entry of `id`. */
const lock = (id: string, sha256: string): LockedMigration => ({ id, sha256 });

describe(checkMigrationLock, () => {
  it("passes a lock every unit still matches, and a new migration the lock does not name", () => {
    expect(
      checkMigrationLock(
        [lock("billing.0001_create_invoices", sha("1"))],
        [unit("billing.0001_create_invoices", sha("1")), unit("billing.0002_add_totals", sha("2"))],
      ),
    ).toEqual([]);
  });

  it("passes everything when nothing is locked", () => {
    expect(checkMigrationLock([], [unit("billing.0001_create_invoices", sha("1"))])).toEqual([]);
  });

  it("refuses a locked migration that compiles to other SQL now", () => {
    const errors = checkMigrationLock(
      [lock("billing.0001_create_invoices", sha("1"))],
      [unit("billing.0001_create_invoices", sha("9"))],
    );
    expect(errors).toEqual([
      expect.objectContaining({
        code: "migration_locked_changed",
        subject: "billing.0001_create_invoices",
        file: "src/modules/billing/database/migrations/billing.0001_create_invoices.migration.ts",
      }),
    ]);
    expect(errors[0]?.message).toContain("111111111111 locked, 999999999999 now");
  });

  it("refuses a locked migration that is gone", () => {
    expect(
      checkMigrationLock(
        [
          lock("billing.0001_create_invoices", sha("1")),
          lock("search.0001_create_text_functions", sha("2")),
        ],
        [unit("billing.0001_create_invoices", sha("1"))],
      ),
    ).toEqual([
      expect.objectContaining({
        code: "migration_locked_missing",
        file: "stackra.manifest.json",
        subject: "search.0001_create_text_functions",
      }),
    ]);
  });

  it("refuses a locked migration whose module's previous migration is not locked", () => {
    // billing.0002 was locked; billing.0001 was added (or unlocked) since, so it would run after an applied one.
    expect(
      checkMigrationLock(
        [lock("billing.0002_add_totals", sha("2"))],
        [unit("billing.0001_create_invoices", sha("1")), unit("billing.0002_add_totals", sha("2"))],
      ).map((error) => [error.code, error.subject, error.message.includes("billing.0001")]),
    ).toEqual([["migration_lock_gap", "billing.0002_add_totals", true]]);
  });

  it("refuses a locked migration whose after id is not locked, and ignores another module's previous one", () => {
    expect(
      checkMigrationLock(
        [lock("billing.0001_create_invoices", sha("1"))],
        [
          unit("audit.0001_create_entries", sha("3")),
          unit("billing.0001_create_invoices", sha("1"), ["search.0001_create_text_functions"]),
          unit("search.0001_create_text_functions", sha("2")),
        ],
      ).map((error) => [error.code, error.message.includes("search.0001_create_text_functions")]),
    ).toEqual([["migration_lock_gap", true]]);
  });
});
