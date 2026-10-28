/**
 * Stackra file contract:
 * Purpose: `applySeed({ cwd, environment, pack, version, profile, records })`, the second half of the seed runner
 *          `stackra seed-pack` calls: writes each planned record to the seed ledger as the product default under the
 *          pack version, in one transaction, and answers with the `kind:key` of each record it wrote.
 * Boundary: an upsert that only ever touches a seed-owned row: a record someone changed since the plan was made
 *           (`owner = tenant`) is left as it is and missing from `written`, so a stale plan never overwrites it. It
 *           writes the product-default layer only; a tenant's own values live in the owning package's tenant layer.
 *           The owning packages read their product defaults from the ledger by kind and key.
 * Runtime: node
 * Governing contract: ADR 0396 (decision 1); ADR 0325 (decision 7: seeds are resumable and tested); ADR 0190;
 *                     config-model section 6.
 */
import { openSeedSession } from "#node/functions/open-seed-session.function";

/**
 * Writes planned seed records as product defaults.
 *
 * @throws Error when no database URL is set or a write fails; nothing of the batch is written then.
 * @example
 * const { written } = await applySeed({ cwd, environment: "dev", pack, version: "1.0.0", profile: "minimal", records });
 */
export function applySeed(options: {
  readonly cwd: string;
  readonly environment: string;
  readonly pack: string;
  readonly version: string;
  readonly profile: string;
  readonly records: readonly {
    readonly kind: string;
    readonly key: string;
    readonly hash: string;
    readonly rows: readonly unknown[];
  }[];
}): Promise<{ readonly written: readonly string[] }> {
  return openSeedSession(({ query, transaction }) =>
    transaction(async () => {
      const written: string[] = [];
      for (const record of options.records) {
        // raw-sql: the product default is written or replaced, never over a row someone changed
        const rows = await query(
          'insert into "database"."seed_records" (pack, kind, key, profile, version, hash, owner, rows) ' +
            "values (?, ?, ?, ?, ?, ?, 'seed', ?::jsonb) on conflict (pack, kind, key) do update set " +
            "profile = excluded.profile, version = excluded.version, hash = excluded.hash, rows = excluded.rows, " +
            'updated_at = now() where "database"."seed_records".owner = \'seed\' returning kind, key',
          [
            options.pack,
            record.kind,
            record.key,
            options.profile,
            options.version,
            record.hash,
            JSON.stringify(record.rows),
          ],
        );
        if (rows.length > 0) written.push(`${record.kind}:${record.key}`);
      }
      return { written };
    }),
  );
}
