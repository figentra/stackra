/**
 * Stackra file contract:
 * Purpose: `rollback({ cwd, environment })`, `stackra db rollback`: reverts the last migration (all its step files),
 *          last step first, through the `.down.sql` inverses gen wrote.
 * Boundary: refuses outside dev, preview and test, and stops at a step with no inverse (irreversible), leaving the
 *           version at that step.
 * Runtime: node
 * Governing contract: ADR 0159 (2026-10-23 and 2026-10-24 notes: rollback on dev, preview and test only).
 */
import { openMigrationSession } from "#node/functions/open-migration-session.function";

/** The environments a rollback may run in. */
const ROLLBACK_ENVIRONMENTS = new Set(["dev", "preview", "test"]);

/**
 * Reverts the last migration.
 *
 * @throws Error in a forward-only environment, on a dirty version, or at an irreversible step.
 * @example
 * const { reverted } = await rollback({ cwd: "apps/api", environment: "dev" });
 */
export async function rollback(options: {
  readonly cwd: string;
  readonly environment: string;
}): Promise<{ readonly reverted: readonly string[] }> {
  if (!ROLLBACK_ENVIRONMENTS.has(options.environment))
    throw new Error(`rollback is not allowed in ${options.environment}: it rolls forward only`);
  return openMigrationSession(options.cwd, async ({ files, execute, state }) => {
    const current = await state();
    if (current.dirty) throw new Error(`version ${current.version} is dirty: fix it by hand`);
    const head = files.find((file) => file.version === current.version);
    if (head === undefined) return { reverted: [] };
    const steps = files.filter((file) => file.batch === head.batch && file.version <= head.version);
    const reverted: string[] = [];
    // oxlint-disable-next-line unicorn/no-array-reverse -- reverses an array built here, which nothing else holds; toReversed is ES2023 and the base lib is ES2022
    for (const file of [...steps].reverse()) {
      if (file.inverse === undefined)
        throw new Error(`${file.name} is irreversible: rollback stops here`);
      await execute(file.inverse, file.transactional);
      const previous = files[files.indexOf(file) - 1]?.version ?? 0;
      await execute(
        previous === 0
          ? "delete from schema_migrations"
          : `update schema_migrations set version = ${previous}, dirty = false`,
        true,
      );
      reverted.push(file.name);
    }
    return { reverted };
  });
}
