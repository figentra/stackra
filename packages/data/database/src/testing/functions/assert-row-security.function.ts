/**
 * Stackra file contract:
 * Purpose: `assertRowSecurity`, the row-level-security conformance check of a migrated database: every table holding
 *          the owner column has row-level security enabled and forced and the generated policy
 *          `pol_<table>_<column>`; the service role is neither a superuser nor BYPASSRLS; and a probe, run as that
 *          role with the setting at the first owner, sees no row of another owner and cannot move a row to the
 *          second owner. It throws one error listing every gap.
 * Boundary: test only (`./testing`), against a real Postgres (`usePostgres`). It reads the catalogue and, for the
 *           probe, writes inside a transaction it always rolls back. The probe proves isolation over the rows the test
 *           seeded; on an empty table it proves nothing beyond the catalogue. A missing role is created (`NOLOGIN
 *           NOBYPASSRLS`, usage and table rights on the checked schemas), because a test container's user is a
 *           superuser, which row-level security never restricts. Tenant vocabulary stays in @stackra/tenancy, which
 *           calls this with its column and setting (`assertTenantIsolation`).
 * Runtime: node
 * Governing contract: ADR 0239 (decision 1); ADR 0231 (`pol_<table>_<column>`); ADR 0327 (decision 8).
 */
import type { Database } from "#core/ports/database.port";
import { quoteIdentifier } from "#core/functions/quote-identifier.function";
import type { RowSecurityOptions } from "#testing/types/row-security-options.type";

/** One table holding the owner column, with its row-level-security state. */
interface OwnedTable {
  readonly schema: string;
  readonly table: string;
  readonly enabled: boolean;
  readonly forced: boolean;
  readonly policy: boolean;
}

/** Rolls the probe's transaction back once it has run. */
class ProbeDone extends Error {}

/**
 * Checks the row-level security of every table holding `options.column`.
 *
 * @param database - the connected database (`usePostgres().database`), migrated.
 * @param options - the column, setting, role and probe values.
 * @throws Error listing every gap: a table without RLS, not forced or without its policy, a role that bypasses RLS, a
 *         probe that saw or moved another owner's row.
 * @example
 * await assertRowSecurity(postgres.database, { column: "owner_id", setting: "app.owner_id", role: "app", probe: [a, b] });
 */
export async function assertRowSecurity(
  database: Database,
  options: RowSecurityOptions,
): Promise<void> {
  const { column, setting, role, probe } = options;
  const [own, other] = probe;
  const em = database.em();
  const gaps: string[] = [];
  const tables = (await em.execute(
    `select n.nspname as schema, c.relname as "table", c.relrowsecurity as enabled, c.relforcerowsecurity as forced,
       exists (select 1 from pg_policy p where p.polrelid = c.oid and p.polname = 'pol_' || c.relname || '_' || ?) as policy
     from pg_class c
     join pg_namespace n on n.oid = c.relnamespace
     join pg_attribute a on a.attrelid = c.oid and a.attname = ? and not a.attisdropped
     where c.relkind in ('r', 'p') and n.nspname not in ('pg_catalog', 'information_schema')
     order by 1, 2`,
    [column, column],
  )) as OwnedTable[];
  for (const { schema, table, enabled, forced, policy } of tables) {
    const name = `${schema}.${table}`;
    if (!enabled) gaps.push(`${name} does not enable row-level security`);
    if (!forced)
      gaps.push(`${name} does not force row-level security, so its owner role bypasses it`);
    if (!policy) gaps.push(`${name} has no policy pol_${table}_${column}`);
  }

  const quotedRole = quoteIdentifier(role);
  const [existing] = (await em.execute(
    "select rolsuper, rolbypassrls from pg_roles where rolname = ?",
    [role],
  )) as { rolsuper: boolean; rolbypassrls: boolean }[];
  if (existing === undefined) {
    await em.execute(`create role ${quotedRole} nologin nobypassrls`);
    for (const schema of new Set(tables.map((owned) => owned.schema))) {
      const quoted = quoteIdentifier(schema);
      await em.execute(`grant usage on schema ${quoted} to ${quotedRole}`);
      await em.execute(
        `grant select, insert, update, delete on all tables in schema ${quoted} to ${quotedRole}`,
      );
    }
  } else {
    if (existing.rolsuper)
      gaps.push(`role ${role} is a superuser, which row-level security never restricts`);
    if (existing.rolbypassrls) gaps.push(`role ${role} has BYPASSRLS`);
  }

  for (const { schema, table } of tables) {
    const name = `${quoteIdentifier(schema)}.${quoteIdentifier(table)}`;
    const quotedColumn = quoteIdentifier(column);
    try {
      await em.transactional(async (tx) => {
        await tx.execute(`set local role ${quotedRole}`);
        await tx.execute("select set_config(?, ?, true)", [setting, own]);
        const [seen] = (await tx.execute(
          `select count(*)::int as count from ${name} where ${quotedColumn} is distinct from ?`,
          [own],
        )) as { count: number }[];
        if ((seen?.count ?? 0) > 0)
          gaps.push(
            `${schema}.${table}: a probe as ${own} saw ${seen?.count} rows of other owners`,
          );
        try {
          await tx.execute("savepoint stackra_probe");
          const moved = (await tx.execute(
            `update ${name} set ${quotedColumn} = ? where ${quotedColumn} = ?`,
            [other, own],
            "run",
          )) as { affectedRows?: number };
          if ((moved.affectedRows ?? 0) > 0)
            gaps.push(
              `${schema}.${table}: a probe as ${own} moved ${moved.affectedRows} rows to ${other}`,
            );
        } catch {
          // The policy refused the write, as it must.
          await tx.execute("rollback to savepoint stackra_probe");
        }
        throw new ProbeDone();
      });
    } catch (error) {
      if (!(error instanceof ProbeDone))
        gaps.push(`${schema}.${table}: the probe failed: ${String(error)}`);
    }
  }
  if (gaps.length > 0)
    throw new Error(`row-level security gaps on ${column}:\n- ${gaps.join("\n- ")}`);
}
