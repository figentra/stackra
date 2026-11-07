/**
 * Stackra file contract:
 * Purpose: `DatabaseHealthIndicatorDriver`, this package's driver of the contracts `HealthIndicator` port (`database`): it runs `select 1` on the connection. The probe is
 *          bounded by `DatabaseConfig.health.timeout`; a probe that fails or runs past it is `down`, or `degraded` when
 *          `health.critical` is off, so `/readyz` fails a deploy whose the database does not answer. With
 *          `health.rowSecurity` it also reads the connected role, and is `down` (whatever `critical` says) when that
 *          role can bypass row-level security, so `FORCE ROW LEVEL SECURITY` holds for the runtime (tenancy gap J).
 * Boundary: `Driver(HealthIndicator)`, so `/readyz` finds it among the bound `HealthIndicator`s. It probes through
 *           the `Database` port only; the query reads no table. A failure reports the error's name, never its message, and never throws.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 16 and 17), ADR 0184, registry gap R-27; gap analysis devx-ops "Health
 *                     checks" (P0, owner D10); ADR 0347 and the tenancy constitution (FORCE ROW LEVEL SECURITY).
 */
import { Driver } from "@stackra/container";
import { Duration, HealthIndicator, HealthStatus } from "@stackra/contracts";
import type { HealthReport } from "@stackra/contracts";

import type { DatabaseConfig } from "#config/database.config";
import type { Database } from "#core/ports/database.port";

/**
 * Whether the connected role can bypass row-level security: it is, or may become (`pg_has_role` MEMBER), a superuser
 * or a BYPASSRLS role, or it may become the owner of a table with row security, which can turn FORCE off.
 */
const ROLE_PROBE = `select
  exists (select 1 from pg_roles r where (r.rolsuper or r.rolbypassrls) and pg_has_role(current_user, r.oid, 'MEMBER')) as "bypass",
  (select count(*)::int from pg_class c where c.relrowsecurity and pg_has_role(current_user, c.relowner, 'MEMBER')) as "owned"`;

/** Whether the database answers a cheap probe in time. */
export class DatabaseHealthIndicatorDriver extends Driver(HealthIndicator) {
  /** The dependency this indicator reports on. */
  override readonly name = "database";

  private readonly database: Database;

  private readonly health: DatabaseConfig["health"];

  /**
   * @param database - the bound `Database`.
   * @param config - `health` holds the timeout and whether a failure is critical.
   */
  constructor(database: Database, config: DatabaseConfig) {
    super();
    this.database = database;
    this.health = config.health;
  }

  /** Runs `select 1`, then, with `health.rowSecurity`, the role probe. */
  override async check(): Promise<HealthReport> {
    const started = Date.now();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const late = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () =>
          reject(Object.assign(new Error("database probe timed out"), { name: "TimeoutError" })),
        Duration.toMilliseconds(this.health.timeout),
      );
    });
    try {
      await Promise.race([this.database.em().execute("select 1"), late]);
      if (this.health.rowSecurity) {
        const [role] = (await Promise.race([this.database.em().execute(ROLE_PROBE), late])) as {
          bypass: boolean;
          owned: number;
        }[];
        const gap =
          role === undefined
            ? "its role could not be read"
            : role.bypass
              ? "its role can bypass row-level security (a superuser or BYPASSRLS)"
              : role.owned > 0
                ? `its role owns ${role.owned} tables with row-level security`
                : undefined;
        if (gap !== undefined)
          return { status: HealthStatus.Down, detail: `the database is open: ${gap}` };
      }
      return { status: HealthStatus.Up, latency: Duration.seconds((Date.now() - started) / 1000) };
    } catch (error) {
      return {
        status: this.health.critical ? HealthStatus.Down : HealthStatus.Degraded,
        detail: `the database did not answer (${(error as Error).name})`,
      };
    } finally {
      clearTimeout(timer);
    }
  }
}
