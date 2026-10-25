/**
 * Stackra file contract:
 * Purpose: `migrate({ cwd, environment })`, `stackra db migrate`: applies the member's pending compiled files in
 *          sequence order, marking the version dirty while a file runs and clean when it ends.
 * Boundary: a dirty version stops the run and names the file; the runner never retries it. A transactional file runs
 *           in one transaction, a non-transactional one as written (one statement). shortcut: no cleanup of an INVALID
 *           index a failed concurrent build left; the error names the file, drop the index by hand.
 * Runtime: node
 * Governing contract: ADR 0159 (decision 2 as amended 2026-10-24).
 */
import { openMigrationSession } from "#node/functions/open-migration-session.function";

/**
 * Applies the pending migrations.
 *
 * @throws Error when the version is dirty or a file fails; the message names the file.
 * @example
 * const { applied } = await migrate({ cwd: "apps/api", environment: "dev" });
 */
export function migrate(options: {
  readonly cwd: string;
  readonly environment: string;
}): Promise<{ readonly applied: readonly string[] }> {
  return openMigrationSession(options.cwd, async ({ files, execute, state }) => {
    const current = await state();
    const last = files.find((file) => file.version === current.version);
    if (current.dirty)
      throw new Error(
        `version ${current.version} is dirty${last ? ` (${last.name})` : ""}: fix it by hand`,
      );
    const applied: string[] = [];
    for (const file of files.filter((candidate) => candidate.version > current.version)) {
      // raw-sql: the version row is the runner's bookkeeping
      await execute(
        `insert into schema_migrations (version, dirty) values (${file.version}, true) on conflict (version) do nothing; delete from schema_migrations where version < ${file.version}`,
        true,
      );
      try {
        await execute(file.sql, file.transactional);
      } catch (error) {
        throw new Error(
          `${file.name} failed: ${error instanceof Error ? error.message : String(error)}`,
          { cause: error },
        );
      }
      await execute(
        `update schema_migrations set dirty = false where version = ${file.version}`,
        true,
      );
      applied.push(file.name);
    }
    return { applied };
  });
}
