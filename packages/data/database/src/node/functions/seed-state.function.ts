/**
 * Stackra file contract:
 * Purpose: `seedState({ cwd, environment, pack })`, the first half of the seed runner `stackra seed-pack` calls: every
 *          record of `pack` the seed ledger holds, with its owner and the hash of the seeded content it holds, so the
 *          CLI plans which records are new, changed, current or kept.
 * Boundary: reads `database.seed_records` only; it writes nothing. `cwd` and `environment` name the member and the
 *           runway environment for the CLI's report; the connection is `directDatabaseUrl()` (ADR 0473).
 * Runtime: node
 * Governing contract: ADR 0396 (decision 1); ADR 0325 (decision 7: seeds are resumable); config-model sections 3
 *                     and 6.
 */
import { openSeedSession } from "#node/functions/open-seed-session.function";

/**
 * The stored records of a seed pack.
 *
 * @throws Error when no database URL is set or the ledger table is missing (run `stackra db migrate` first).
 * @example
 * const state = await seedState({ cwd: "services/commerce", environment: "dev", pack: "seed-pack:commerce" });
 */
export function seedState(options: {
  readonly cwd: string;
  readonly environment: string;
  readonly pack: string;
}): Promise<
  readonly {
    readonly kind: string;
    readonly key: string;
    readonly owner: "seed" | "tenant";
    readonly hash: string;
  }[]
> {
  return openSeedSession(async ({ query }) => {
    // raw-sql: the ledger rows of one pack; the runner owns this table
    const rows = await query(
      'select kind, key, owner, hash from "database"."seed_records" where pack = ? order by kind, key',
      [options.pack],
    );
    return rows.map((row) => ({
      kind: String(row["kind"]),
      key: String(row["key"]),
      owner: row["owner"] === "tenant" ? ("tenant" as const) : ("seed" as const),
      hash: String(row["hash"]),
    }));
  });
}
