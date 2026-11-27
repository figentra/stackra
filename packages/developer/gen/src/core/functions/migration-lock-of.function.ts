/**
 * Stackra file contract:
 * Purpose: `migrationLockOf`, the locked migrations of a committed `stackra.manifest.json`: its `migrations` section,
 *          in apply order; none when the manifest is absent or has no section (a member that predates the lock, or has
 *          no migration).
 * Boundary: pure. A section that is not a list of `{ id, sha256 }` entries (a 64-character lowercase hex SHA-256), or
 *           that names an id twice, is refused (`migration_lock_malformed`) rather than read as no lock, since a lock
 *           read as empty would unfreeze every migration.
 * Runtime: isomorphic
 * Governing contract: ADR 0159 (2026-10-23 note: the SHA-256 lock in `stackra.manifest.json`); STA-2160.
 */
import type { StackraManifest } from "@stackra/contracts";

import type { GenError } from "#core/types/gen-error.type";
import type { LockedMigration } from "#core/types/locked-migration.type";

/** A lowercase hex SHA-256. */
const SHA256 = /^[0-9a-f]{64}$/;

/** Whether `entry` is one well-formed lock entry. */
const isLocked = (entry: unknown): entry is LockedMigration =>
  typeof entry === "object" &&
  entry !== null &&
  typeof (entry as Record<string, unknown>)["id"] === "string" &&
  typeof (entry as Record<string, unknown>)["sha256"] === "string" &&
  SHA256.test((entry as Record<string, string>)["sha256"] ?? "");

/** What is wrong with a `migrations` section, or undefined when it is a well-formed lock. */
function problemOf(section: unknown): string | undefined {
  if (!Array.isArray(section)) return "the `migrations` section is not a list of locked migrations";
  const entries = section as readonly unknown[];
  const bad = entries.findIndex((entry) => !isLocked(entry));
  if (bad !== -1)
    return `entry ${bad} of the \`migrations\` section is not \`{ "id": <string>, "sha256": <64 lowercase hex> }\``;
  const ids = (entries as readonly LockedMigration[]).map((entry) => entry.id);
  const twice = ids.find((id, index) => ids.indexOf(id) !== index);
  return twice === undefined ? undefined : `the \`migrations\` section locks ${twice} twice`;
}

/**
 * Reads the migration lock of `manifest`.
 *
 * @param manifest - the committed manifest, or undefined on a member's first run.
 * @example
 * migrationLockOf(committed).locked.map((entry) => entry.id); // ["billing.0001_create_invoices"]
 */
export function migrationLockOf(manifest: StackraManifest | undefined): {
  readonly locked: readonly LockedMigration[];
  readonly errors: readonly GenError[];
} {
  const section = manifest?.["migrations"];
  if (section === undefined) return { locked: [], errors: [] };
  const problem = problemOf(section);
  if (problem === undefined) return { locked: section as readonly LockedMigration[], errors: [] };
  return {
    locked: [],
    errors: [
      {
        code: "migration_lock_malformed",
        file: "stackra.manifest.json",
        line: 0,
        column: 0,
        subject: "migrations",
        message: problem,
        fix: "restore the `migrations` section from the last commit: gen writes it, and a hand edit only ever drops the entry of a migration no environment has applied",
      },
    ],
  };
}
