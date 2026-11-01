/**
 * Stackra file contract:
 * Purpose: `DatabaseRunner`, the one seam the `db:*` commands call: `migrate`, `rollback`, `status` and `seedState`
 *          over the runner functions of this entry, so a command takes it through its constructor and a test hands it a
 *          fake.
 * Boundary: delegates and adds nothing but `status`, the applied flag of each compiled file; every refusal (forward-only
 *           environments, a dirty version, an edited file) is the runner function's own. Connects through
 *           `DATABASE_DIRECT_URL`, never an argument.
 * Runtime: node
 * Governing contract: STA-1731 spec FR-001; ADR 0159; ADR 0396 (decision 1); ADR 0473 (decision 3).
 */
import { Service } from "@stackra/container";

import type { seedState as SeedState } from "#node/functions/seed-state.function";

/** The target of a runner call: the member's folder and the runway environment. */
type Target = { readonly cwd: string; readonly environment: string };

/**
 * Runs the migration and seed functions for the console.
 *
 * @example
 * const { applied } = await runner.migrate({ cwd: ".", environment: "dev" });
 */
export class DatabaseRunner extends Service {
  /** Applies the pending migrations; see `migrate`. */
  async migrate(target: Target): Promise<{ readonly applied: readonly string[] }> {
    // Imported on use: the runner is a wiring binding, and a static import would load the migration runner (and its
    // session) into every test setup of the package, ahead of a test's own mock of it.
    const { migrate } = await import("#node/functions/migrate.function");
    return migrate(target);
  }

  /** Reverts the last migration; see `rollback`. */
  async rollback(target: Target): Promise<{ readonly reverted: readonly string[] }> {
    const { rollback } = await import("#node/functions/rollback.function");
    return rollback(target);
  }

  /** The recorded version, its dirty flag and whether each compiled file is applied. */
  async status(cwd: string): Promise<{
    readonly version: number;
    readonly dirty: boolean;
    readonly migrations: readonly { readonly name: string; readonly applied: boolean }[];
  }> {
    const { openMigrationSession } =
      await import("#node/functions/open-migration-session.function");
    return openMigrationSession(cwd, async (session) => {
      const current = await session.state();
      return {
        ...current,
        migrations: session.files.map((file) => ({
          name: file.name,
          applied: file.version <= current.version,
        })),
      };
    });
  }

  /** The stored records of `pack`; see `seedState`. */
  async seedState(
    target: Target & { readonly pack: string },
  ): Promise<Awaited<ReturnType<typeof SeedState>>> {
    const { seedState } = await import("#node/functions/seed-state.function");
    return seedState(target);
  }
}
