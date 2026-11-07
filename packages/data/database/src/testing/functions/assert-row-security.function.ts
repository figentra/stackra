/**
 * Stackra file contract:
 * Purpose: `assertRowSecurity`, the row-level-security audit of a migrated database. It walks every table of every
 *          non-system schema: a table without the owner column must be a listed platform table (`PLATFORM_TABLES` or
 *          the caller's `platform`, each with its reason), else it is returned as a warning naming its group
 *          (`unownedTableGroup`) until 0.20, and is a gap in strict mode (`strict`, `STACKRA_GEN_STRICT=1`); so is a
 *          table in the expand step (a nullable owner column, no owner policy, a permissive `scope_path` policy). Any
 *          other table with it has row-level security enabled and forced, exactly one permissive policy
 *          (`pol_<table>_<column>`, the owner equality) and only restrictive policies named after their column beside
 *          it. The service role is neither a superuser nor BYPASSRLS. Then, per owned table, it seeds a row of each
 *          probe owner and, as that role, proves a session with the setting unset sees no row, a session as the first
 *          owner sees its own row and none of the second's, and cannot move its row to the second owner. It throws
 *          one error listing every gap.
 * Boundary: test only (`./testing`), against a real Postgres (`usePostgres`), connected as a superuser (a test
 *           container's user). Each probe runs in a transaction it always rolls back; to seed, it drops the table's
 *           check constraints and the NOT NULL of every non-key column there and skips foreign keys and triggers
 *           (`session_replication_role = replica`), so the seed needs a value only for the key; a key type
 *           `seedValue` cannot fill is reported. Partitions are seeded through their parent. Tables an extension owns
 *           are not the service's and are skipped. The role is created `NOLOGIN NOBYPASSRLS` when missing, and given
 *           usage and table rights on the owned tables' schemas on every call. Tenant vocabulary stays in
 *           @stackra/tenancy, which gives the column and setting (`tenantIsolationOptions`).
 * Runtime: node
 * Governing contract: ADR 0239 (decision 1); ADR 0347 (decision 5: the catalogue audit); ADR 0231
 *                     (`pol_<table>_<column>`); ADR 0327 (decision 8); `.agents/rules/tenancy.md` (point 7).
 */
import type { EntityManager } from "@mikro-orm/postgresql";

import type { Database } from "#core/ports/database.port";
import { quoteIdentifier } from "#core/functions/quote-identifier.function";
import { PLATFORM_TABLES } from "#testing/constants/platform-tables.constant";
import { policyGaps } from "#testing/functions/policy-gaps.function";
import { seedValue } from "#testing/functions/seed-value.function";
import { unownedTableGroup } from "#testing/functions/unowned-table-group.function";
import type { PolicyRow } from "#testing/types/policy-row.type";
import type { RowSecurityOptions } from "#testing/types/row-security-options.type";
import type { SeedColumn } from "#testing/types/seed-column.type";

/** One table of the audited schemas, with its row-level-security state. */
interface AuditedTable {
  readonly schema: string;
  readonly table: string;
  readonly owned: boolean;
  readonly partition: boolean;
  readonly enabled: boolean;
  readonly forced: boolean;
}

/** One column of an audited table. */
interface ColumnRow extends SeedColumn {
  readonly schema: string;
  readonly table: string;
  readonly name: string;
  readonly notNull: boolean;
  readonly hasDefault: boolean;
  /** An identity or generated column, which an insert leaves to Postgres. */
  readonly generated: boolean;
  readonly primary: boolean;
}

/** Rolls the probe's transaction back once it has run. */
class ProbeDone extends Error {}

/** The tables of every schema the service owns: no system schema, no table an extension made. */
const TABLES = `select n.nspname as schema, c.relname as "table", c.relispartition as partition,
    c.relrowsecurity as enabled, c.relforcerowsecurity as forced,
    exists (select 1 from pg_attribute a where a.attrelid = c.oid and a.attname = ? and not a.attisdropped) as owned
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where c.relkind in ('r', 'p') and n.nspname <> 'information_schema' and n.nspname not like 'pg\\_%'
    and not exists (select 1 from pg_depend d where d.classid = 'pg_class'::regclass and d.objid = c.oid and d.deptype = 'e')
  order by 1, 2`;

const POLICIES = `select n.nspname as schema, c.relname as "table", p.polname as name, p.polpermissive as permissive,
    p.polcmd::text as command, coalesce(pg_get_expr(p.polqual, p.polrelid), '') as "using",
    coalesce(pg_get_expr(p.polwithcheck, p.polrelid), '') as "check"
  from pg_policy p
  join pg_class c on c.oid = p.polrelid
  join pg_namespace n on n.oid = c.relnamespace`;

const COLUMNS = `select n.nspname as schema, c.relname as "table", a.attname as name, a.attnotnull as "notNull",
    a.atthasdef as "hasDefault", (a.attidentity <> '' or a.attgenerated <> '') as generated,
    format_type(a.atttypid, a.atttypmod) as type, t.typcategory::text as category, t.typname as "typeName",
    exists (select 1 from pg_index i where i.indrelid = c.oid and i.indisprimary and a.attnum = any(i.indkey::int2[])) as primary
  from pg_attribute a
  join pg_class c on c.oid = a.attrelid
  join pg_namespace n on n.oid = c.relnamespace
  join pg_type t on t.oid = a.atttypid
  where c.relkind in ('r', 'p') and a.attnum > 0 and not a.attisdropped
  order by a.attnum`;

/**
 * Seeds one row of each owner into a table inside the caller's transaction, under a savepoint.
 *
 * @returns undefined once seeded, else why it could not be (the savepoint is rolled back).
 */
async function seedOwners(
  tx: EntityManager,
  name: string,
  columns: readonly ColumnRow[],
  column: string,
  owners: readonly [string, string],
): Promise<string | undefined> {
  // raw-sql: a savepoint, so a seed the table refuses rolls back without aborting the probe's transaction
  await tx.execute("savepoint stackra_seed");
  try {
    // raw-sql: triggers off while the probe seeds its two owner rows, inside the savepoint
    await tx.execute("set local session_replication_role = replica");
    // raw-sql: the catalogue's check constraints of the audited table, which the seed drops inside the savepoint
    const checks = (await tx.execute(
      "select conname from pg_constraint where conrelid = ?::regclass and contype = 'c'",
      [name],
    )) as { conname: string }[];
    for (const { conname } of checks)
      // raw-sql: the seed relaxes the audited table inside the savepoint; names are quoted catalogue identifiers
      await tx.execute(`alter table ${name} drop constraint ${quoteIdentifier(conname)}`);
    for (const known of columns)
      if (known.notNull && !known.primary && !known.generated && known.name !== column)
        // raw-sql: the seed relaxes the audited table inside the savepoint; names are quoted catalogue identifiers
        await tx.execute(
          `alter table ${name} alter column ${quoteIdentifier(known.name)} drop not null`,
        );
    const keys = columns.filter(
      (known) => known.primary && !known.generated && !known.hasDefault && known.name !== column,
    );
    const values = keys.map((key) => {
      const value = seedValue(key);
      if (value === undefined) throw new Error(`no seed value for key ${key.name} (${key.type})`);
      return value;
    });
    const row = `(${["?", ...values].join(", ")})`;
    const into = [column, ...keys.map((key) => key.name)].map(quoteIdentifier).join(", ");
    // raw-sql: one row per probe owner; names are quoted catalogue identifiers and the owners are parameters
    await tx.execute(`insert into ${name} (${into}) values ${row}, ${row}`, [...owners], "run");
    // raw-sql: keeps the seeded rows for the probe
    await tx.execute("release savepoint stackra_seed");
    return undefined;
  } catch (error) {
    // raw-sql: drops a seed the table refused, so the probe reports it instead of failing
    await tx.execute("rollback to savepoint stackra_seed");
    return String(error);
  }
}

/**
 * Audits the row-level security of every table, against `options.column`.
 *
 * @param database - the connected database (`usePostgres().database`), migrated.
 * @param options - the column, setting, role, probe values and the caller's platform tables.
 * @returns the warnings, until 0.20 (each a gap when `options.strict` or `STACKRA_GEN_STRICT=1`): each unlisted
 *          table without the owner column, with its group, and each table in the expand step.
 * @throws Error listing every gap: an unlisted table without the owner column in strict mode, a listed one with it, an
 *         owned table without RLS, not forced, without its one permissive owner policy or with another policy that is
 *         permissive or misnamed, a table the probe could not seed, a role that bypasses RLS, a probe that saw or
 *         moved another owner's row, saw rows with the setting unset or did not see its own.
 * @example
 * const options = { column: "owner_id", setting: "app.owner_id", role: "app", probe: [a, b] } as const;
 * const warnings = await assertRowSecurity(postgres.database, options);
 */
export async function assertRowSecurity(
  database: Database,
  options: RowSecurityOptions,
): Promise<readonly string[]> {
  const { column, setting, role, probe } = options;
  const strict = options.strict ?? process.env["STACKRA_GEN_STRICT"] === "1";
  const warnings: string[] = [];
  const [own, other] = probe;
  const platform = new Map([...PLATFORM_TABLES, ...(options.platform ?? [])]);
  const em = database.em();
  const gaps: string[] = [];
  const tables = (await em.execute(TABLES, [column])) as AuditedTable[];
  const policies = (await em.execute(POLICIES)) as (PolicyRow & {
    schema: string;
    table: string;
  })[];
  const columns = (await em.execute(COLUMNS)) as ColumnRow[];
  const of = <T extends { schema: string; table: string }>(
    rows: readonly T[],
    owned: AuditedTable,
  ) => rows.filter((row) => row.schema === owned.schema && row.table === owned.table);

  const owned: AuditedTable[] = [];
  for (const audited of tables) {
    const name = `${audited.schema}.${audited.table}`;
    const reason = platform.get(name);
    if (!audited.owned) {
      if (reason === undefined)
        // shortcut: warn-only for tables without tenant_id until 0.20, then error (push to `gaps` always).
        (strict ? gaps : warnings).push(
          `${name} has no ${column} column and is not a platform table (${unownedTableGroup(audited.enabled, of(policies, audited), setting)}); give it ${column} or list it in \`platform\` with its reason`,
        );
      else if (reason.trim() === "")
        gaps.push(`${name} is listed as a platform table with no reason`);
      continue;
    }
    if (reason !== undefined)
      gaps.push(`${name} is listed as a platform table but holds ${column}`);
    const tablePolicies = of(policies, audited);
    // The expand step (ADR 0347 d1 migration): a nullable owner column, no owner policy yet, and the scope_path
    // policy still the permissive one. Its probe would prove nothing, so it is staged like an unowned table.
    const expanding =
      of(columns, audited).some((known) => known.name === column && !known.notNull) &&
      !tablePolicies.some((policy) => policy.name === `pol_${audited.table}_${column}`) &&
      tablePolicies.some(
        (policy) => policy.permissive && `${policy.using} ${policy.check}`.includes("scope_path"),
      );
    if (expanding) {
      // shortcut: warn-only for tables without tenant_id until 0.20, then error (push to `gaps` always).
      (strict ? gaps : warnings).push(
        `${name} holds a nullable ${column} with no pol_${audited.table}_${column} policy ((a) ancestor scope_path table in the expand step, awaiting backfill and the contract step)`,
      );
      continue;
    }
    owned.push(audited);
    if (!audited.enabled) gaps.push(`${name} does not enable row-level security`);
    if (!audited.forced)
      gaps.push(`${name} does not force row-level security, so its owner role bypasses it`);
    gaps.push(
      ...policyGaps(
        name,
        audited.table,
        column,
        setting,
        tablePolicies,
        of(columns, audited).map((known) => known.name),
      ),
    );
  }

  const quotedRole = quoteIdentifier(role);
  // raw-sql: the probe role's flags from the catalogue: no superuser, no BYPASSRLS
  const [existing] = (await em.execute(
    "select rolsuper, rolbypassrls from pg_roles where rolname = ?",
    [role],
  )) as { rolsuper: boolean; rolbypassrls: boolean }[];
  // raw-sql: the probe role, which row-level security applies to; the name is a quoted identifier
  if (existing === undefined) await em.execute(`create role ${quotedRole} nologin nobypassrls`);
  else {
    if (existing.rolsuper)
      gaps.push(`role ${role} is a superuser, which row-level security never restricts`);
    if (existing.rolbypassrls) gaps.push(`role ${role} has BYPASSRLS`);
  }
  // Every call: a table made after an earlier call needs the rights too, or the probe fails on a missing grant.
  for (const schema of new Set(owned.map((audited) => audited.schema))) {
    const quoted = quoteIdentifier(schema);
    // raw-sql: the probe role may use each audited schema
    await em.execute(`grant usage on schema ${quoted} to ${quotedRole}`);
    // raw-sql: the probe role may read and write each audited table, so only the policy can refuse it
    await em.execute(
      `grant select, insert, update, delete on all tables in schema ${quoted} to ${quotedRole}`,
    );
  }

  const quotedColumn = quoteIdentifier(column);
  for (const audited of owned) {
    const label = `${audited.schema}.${audited.table}`;
    const name = `${quoteIdentifier(audited.schema)}.${quoteIdentifier(audited.table)}`;
    try {
      await em.transactional(async (tx) => {
        // A partition gets its rows through its parent, whose seed lands in it when the key routes there.
        const unseeded = audited.partition
          ? undefined
          : await seedOwners(tx, name, of(columns, audited), column, probe);
        if (unseeded !== undefined)
          gaps.push(
            `${label}: could not seed a row of each probe owner, so no cross-owner read ran: ${unseeded}`,
          );
        // raw-sql: the probe reads as the role row-level security applies to
        await tx.execute(`set local role ${quotedRole}`);
        // raw-sql: the policy's session setting, unset; the setting name is a parameter
        await tx.execute("select set_config(?, '', true)", [setting]);
        // raw-sql: counts the rows the policy shows with the setting unset (it must show none)
        const [unset] = (await tx.execute(`select count(*)::int as count from ${name}`)) as {
          count: number;
        }[];
        if ((unset?.count ?? 0) > 0)
          gaps.push(`${label}: a probe with ${setting} unset saw ${unset?.count} rows`);
        // raw-sql: the policy's session setting, set to one owner; both values are parameters
        await tx.execute("select set_config(?, ?, true)", [setting, own]);
        // raw-sql: counts the rows the policy shows that owner, its own and any other owner's
        const [seen] = (await tx.execute(
          `select count(*) filter (where ${quotedColumn} is distinct from ?)::int as others,
             count(*) filter (where ${quotedColumn} = ?)::int as mine
           from ${name}`,
          [own, own],
        )) as { others: number; mine: number }[];
        if ((seen?.others ?? 0) > 0)
          gaps.push(`${label}: a probe as ${own} saw ${seen?.others} rows of other owners`);
        if (unseeded === undefined && !audited.partition && (seen?.mine ?? 0) === 0)
          gaps.push(
            `${label}: a probe as ${own} saw none of its own seeded rows, so the policy does not match ${setting}`,
          );
        try {
          // raw-sql: a savepoint, so a write the policy refuses does not abort the probe's transaction
          await tx.execute("savepoint stackra_probe");
          // raw-sql: tries to move one owner's rows to the other owner; the policy must refuse it
          const moved = (await tx.execute(
            `update ${name} set ${quotedColumn} = ? where ${quotedColumn} = ?`,
            [other, own],
            "run",
          )) as { affectedRows?: number };
          if ((moved.affectedRows ?? 0) > 0)
            gaps.push(`${label}: a probe as ${own} moved ${moved.affectedRows} rows to ${other}`);
        } catch {
          // The policy refused the write, as it must.
          // raw-sql: undoes the refused write so the probe can finish
          await tx.execute("rollback to savepoint stackra_probe");
        }
        throw new ProbeDone();
      });
    } catch (error) {
      if (!(error instanceof ProbeDone)) gaps.push(`${label}: the probe failed: ${String(error)}`);
    }
  }
  if (gaps.length > 0)
    throw new Error(`row-level security gaps on ${column}:\n- ${gaps.join("\n- ")}`);
  return warnings;
}
