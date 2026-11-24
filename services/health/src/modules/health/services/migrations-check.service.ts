/**
 * Stackra file contract:
 * Purpose: `MigrationsCheckService`, a readiness check (`migrations`) beside the bound `HealthIndicators`: `up`
 *          when the migration ledger (`schema_migrations`, golang-migrate's shape, which Encore applies before the
 *          service starts) holds one clean version and every table this build's models need exists.
 * Boundary: reads the ledger and the catalogue through the `Database` port only and writes nothing. `down` when the
 *           ledger is missing, empty or dirty (a migration that crashed mid-file), or when a model's table is absent (the
 *           build is newer than the database). A failure reports the error's name, never its message, and never throws.
 * Runtime: node
 * Governing contract: ADR 0159 (the compiled migration stream, `schema_migrations`); ADR 0238 (one logical database per
 *                     service); ADR 0190 (health); registry gap R-27.
 */
import { Service } from "@stackra/container";
import { Duration, HealthStatus } from "@stackra/contracts";
import type { HealthReport } from "@stackra/contracts";
import type { Database } from "@stackra/database";

import type { ReadinessCheck } from "#modules/health/types/readiness-check.type";

/** A row of golang-migrate's ledger. */
interface LedgerRow {
  readonly version: number | string;
  readonly dirty: boolean;
}

/** One identifier, quoted. */
function quote(name: string): string {
  return `"${name.replaceAll('"', '""')}"`;
}

/** `"schema"."table"`, each part quoted, for a catalogue lookup. */
function qualified(schema: string | undefined, table: string): string {
  return `${quote(schema ?? "public")}.${quote(table)}`;
}

/** Whether the database is migrated to the schema this build expects. */
export class MigrationsCheckService extends Service implements ReadinessCheck {
  /** The dependency this check reports on. */
  readonly name = "migrations";

  private readonly database: Database;

  /**
   * @param database - the bound `Database`.
   */
  constructor(database: Database) {
    super();
    this.database = database;
  }

  /** Reads the ledger, then looks for each model's table. */
  async check(): Promise<HealthReport> {
    const started = Date.now();
    try {
      const em = this.database.em();
      // raw-sql: the ledger is golang-migrate's own table, which Encore applies and no model maps
      const ledger = (await em.execute(
        "select version, dirty from schema_migrations",
      )) as LedgerRow[];
      const [row] = ledger;
      if (row === undefined || ledger.length !== 1)
        return {
          status: HealthStatus.Down,
          detail: "the migration ledger holds no single version",
        };
      if (row.dirty)
        return { status: HealthStatus.Down, detail: `version ${row.version} is dirty` };
      const missing: string[] = [];
      for (const [, meta] of em.getMetadata().getAll()) {
        const table = meta.tableName;
        if (!table) continue;
        const name = qualified(meta.schema, table);
        // raw-sql: a catalogue lookup of one table by its quoted name, which no model query expresses
        const [found] = (await em.execute("select to_regclass(?) is not null as present", [
          name,
        ])) as { present: boolean }[];
        if (found?.present !== true) missing.push(name);
      }
      if (missing.length > 0)
        return {
          status: HealthStatus.Down,
          detail: `${missing.length} tables are not migrated: ${missing.join(", ")}`,
        };
      return { status: HealthStatus.Up, latency: Duration.seconds((Date.now() - started) / 1000) };
    } catch (error) {
      return {
        status: HealthStatus.Down,
        detail: `the migration state could not be read (${(error as Error).name})`,
      };
    }
  }
}
