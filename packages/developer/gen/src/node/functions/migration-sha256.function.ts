/**
 * Stackra file contract:
 * Purpose: `migrationSha256`, the SHA-256 that locks one compiled migration in `stackra.manifest.json`: of its `after`
 *          ids and of each step's transactional flag, statements and inverse (or `false`), so a change to what runs
 *          forward, to its order edges or to its rollback is a change to the lock.
 * Boundary: pure apart from hashing. A whole comment line written for a linter (`-- squawk-ignore …`, `-- lint: …`)
 *           is left out, as the runner's checksum leaves it out: it never changes what runs.
 * Runtime: node
 * Governing contract: ADR 0159 (2026-10-23 note: each compiled migration locked with a SHA-256); STA-2160.
 */
import { createHash } from "node:crypto";

import type { MigrationUnit } from "#core/types/migration-unit.type";

/** A whole comment line written for a linter, as `readMigrationFiles` (@stackra/database/node) reads it. */
const LINT_LINE = /^-- (?:squawk-ignore|lint:)[^\n]*\n/gm;

/** A statement without its lint lines. */
const statement = (sql: string): string => sql.replaceAll(LINT_LINE, "");

/**
 * The lowercase hex SHA-256 of `unit`'s `after` ids and steps.
 *
 * @example
 * migrationSha256({ after: [], steps: [{ sql: ["create table x ()"], transactional: true, inverse: false }] });
 * // a 64-character hex string
 */
export function migrationSha256(unit: Pick<MigrationUnit, "after" | "steps">): string {
  const material = JSON.stringify([
    unit.after,
    unit.steps.map((step) => [
      step.transactional,
      step.sql.map(statement),
      step.inverse === false ? false : step.inverse.map(statement),
    ]),
  ]);
  return createHash("sha256").update(material).digest("hex");
}
