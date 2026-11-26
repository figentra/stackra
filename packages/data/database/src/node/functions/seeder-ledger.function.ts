/**
 * Stackra file contract:
 * Purpose: `seederLedger()`, the `SeedLedger` over the seed ledger table (`database.seed_records`, migration 0003): one
 *          row per
 *          applied seeder under the pack `seeder:<member>`, kind `seeder`, key `<module>.<profile>`, its checksum in
 *          `hash` and who ran it, and when, in `rows`.
 * Boundary: reads and writes through the connected database's running entity manager, so `record` joins the seeder's
 *           transaction. Seeder rows sit beside the seed-pack records, which use their own pack keys, and never touch
 *           them. The table is named with its schema, as `applySeed` and `seedState` name it: migration 0003 creates it in
 *           the `database` schema, which is not on the search path, so an unqualified name finds no table.
 * Runtime: node
 * Governing contract: ADR 0325 (decision 7); ADR 0396 (decision 1: the seed ledger); STA-1709; STA-2840.
 */
import { Database } from "#core/ports/database.port";
import type { SeedLedger } from "#node/types/seed-ledger.type";

/** The ledger kind of a seeder run. */
const KIND = "seeder";

/**
 * The seed ledger of seeder runs.
 *
 * @example
 * await runSeeders({ container, member: "commerce", seeders, profile: "demo", ledger: seederLedger() });
 */
export function seederLedger(): SeedLedger {
  return {
    async applied(member) {
      // raw-sql: the seed ledger is the runner's bookkeeping, not a model
      const rows = await Database.current()
        .em()
        .execute<{ key: string; hash: string }[]>(
          'select key, hash from "database"."seed_records" where pack = ? and kind = ?',
          [`seeder:${member}`, KIND],
        );
      return new Map(rows.map((row) => [row.key, row.hash]));
    },
    async record(member, run) {
      // raw-sql: the seed ledger is the runner's bookkeeping, not a model
      await Database.current()
        .em()
        .execute(
          'insert into "database"."seed_records" (pack, kind, key, profile, version, hash, owner, rows, created_at, updated_at) ' +
            "values (?, ?, ?, ?, ?, ?, 'seed', ?::jsonb, now(), now()) on conflict (pack, kind, key) do update set " +
            "profile = excluded.profile, hash = excluded.hash, rows = excluded.rows, updated_at = now()",
          [
            `seeder:${member}`,
            KIND,
            run.key,
            run.profile,
            "seeder",
            run.checksum,
            JSON.stringify([{ ranBy: run.ranBy, at: new Date().toISOString() }]),
          ],
        );
    },
  };
}
