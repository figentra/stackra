/**
 * Stackra file contract:
 * Purpose: `assertRowSecurity`, the row-level-security audit of a migrated database. It walks every table of every
 *          non-system schema: a table without the owner column must be a listed platform table (`PLATFORM_TABLES` or
 *          the caller's `platform`, each with its reason), else it is a gap naming its group (`unownedTableGroup`;
 *          the tenancy contract step, ADR 0239). Only the audit's own tests pass `strict: false`, to read the groups
 *          back as warnings. A table in
 *          `ISOLATION_SCOPE_TABLES` (group (b) by name) is audited by its own owner column, `isolation_scope_id`; a
 *          table whose `pol_<table>_scope_id` is exactly the `equals` or `equalsOrUnset` policy
 *          `Blueprint.rowLevelSecurity` writes on the setting (group (b) by shape, core payments' tables) by `scope_id`,
 *          and any looser variant is not accepted. With `migrationsDirectory`, the compiled migrations'
 *          `t.platformTable` declarations join the platform tables (and are refused while the table holds the owner
 *          column, a scope id or an isolation scope id), and each `t.reviewedPolicy` table must enable and force
 *          row-level security and hold every policy it names; it is not held to the owner policy or probed. Any
 *          other table with the owner column has row-level security enabled and forced, exactly one permissive policy
 *          (`pol_<table>_<column>`, the owner equality, or the platform form with its two write policies) and only
 *          restrictive policies named after their column beside it. The service role is neither a superuser nor
 *          BYPASSRLS. Then, per owned table, it seeds a row of each probe owner and, as that role, proves a session with
 *          the setting unset sees no owner's row, a session as the first owner sees its own row and none of the
 *          second's (a platform-form table's NULL rows are the platform's, which every session reads), and cannot move
 *          its row to the second owner; on a platform-form table it also seeds a NULL row, which the first owner can
 *          neither take over nor delete. The system-access role and everything naming it (ADR 0239 amendment, gap A)
 *          are held to the exact `t.systemAccess` and `schema.systemFunction` shape (`systemAccessGaps`): its policies
 *          are left out of the owner checks and checked there, with its grants, its memberships, the functions it owns
 *          and a `SET ROLE` probe as the service role. It throws one error listing every gap.
 * Boundary: test only (`./testing`), against a real Postgres (`usePostgres`), connected as a superuser (a test
 *           container's user). Each probe runs in a transaction it always rolls back; to seed, it drops the table's
 *           check constraints and the NOT NULL of every non-key column there and skips foreign keys and triggers
 *           (`session_replication_role = replica`), so the seed needs a value only for the key; a key type
 *           `seedValue` cannot fill is reported. Partitions are seeded through their parent. Tables an extension owns
 *           are not the service's and are skipped. The role is created `NOLOGIN NOBYPASSRLS` when missing, and given
 *           usage and table rights on the owned tables' schemas on every call. Tenant vocabulary stays in
 *           @stackra/tenancy, which gives the column and setting (`tenantIsolationOptions`).
 * Runtime: node
 * Governing contract: ADR 0239 (decision 1; 2026-11-07 amendment, items 3 and 7, group (c), gap A); ADR 0347 (decision 5: the catalogue
 *                     audit); ADR 0231 (`pol_<table>_<column>`); ADR 0327 (decision 8); `.agents/rules/tenancy.md`
 *                     (point 7).
 */
import type { EntityManager } from "@mikro-orm/postgresql";

import type { Database } from "#core/ports/database.port";
import { constraintName } from "#core/functions/constraint-name.function";
import { quoteIdentifier } from "#core/functions/quote-identifier.function";
import { tableDeclarations } from "#core/functions/table-declarations.function";
import { BlueprintRecord } from "#core/records/blueprint.record";
import { readMigrationFiles } from "#node/functions/read-migration-files.function";
import { ISOLATION_SCOPE_TABLES } from "#testing/constants/isolation-scope-tables.constant";
import { isSystemAccessPolicy } from "#testing/functions/is-system-access-policy.function";
import { PLATFORM_TABLES } from "#testing/constants/platform-tables.constant";
import { policyGaps } from "#testing/functions/policy-gaps.function";
import { seedValue } from "#testing/functions/seed-value.function";
import { systemAccessGaps } from "#testing/functions/system-access-gaps.function";
import { unownedTableGroup } from "#testing/functions/unowned-table-group.function";
import type { RolePolicyRow } from "#testing/types/role-policy-row.type";
import type { RowSecurityOptions } from "#testing/types/row-security-options.type";
import type { SeedColumn } from "#testing/types/seed-column.type";

/** One table of the audited schemas, with its row-level-security state. */
interface AuditedTable {
  readonly schema: string;
  readonly table: string;
  /** Whether it holds its owner column: the audit's, or its own in `ISOLATION_SCOPE_TABLES`. */
  readonly owned: boolean;
  /** Its owner column. */
  readonly column: string;
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

/** The columns a declared platform table never holds: a scope id or an isolation scope id names an owner. */
const SCOPE_COLUMNS: ReadonlySet<string> = new Set(["scope_id", "isolation_scope_id"]);

/** The rows of `rows` that belong to one table. */
const of = <T extends { schema: string; table: string }>(
  rows: readonly T[],
  table: { readonly schema: string; readonly table: string },
): T[] => rows.filter((row) => row.schema === table.schema && row.table === table.table);

/** The name the shape probe creates its reference policies under, inside a transaction it rolls back. */
const SHAPE_PROBE = "stackra_shape_probe";

/**
 * The `USING` and `WITH CHECK` text Postgres gives each exact policy `Blueprint.rowLevelSecurity` writes on `scope_id`
 * for `setting` with match `equals` and `equalsOrUnset`, for a column of `type`: each created on the table under a
 * probe name and read back from the catalogue, in a transaction that is always rolled back. Comparing the deparsed
 * text holds a policy to the generated shape exactly, so a looser variant (`... or true`) is not one of them.
 */
async function scopeEqualities(
  em: ReturnType<Database["em"]>,
  schema: string,
  table: string,
  type: string,
  setting: string,
): Promise<{ readonly using: string; readonly check: string }[]> {
  const qualified = `${quoteIdentifier(schema)}.${quoteIdentifier(table)}`;
  const generated = quoteIdentifier(constraintName("pol", table, ["scope_id"]));
  const shapes: { using: string; check: string }[] = [];
  try {
    await em.transactional(async (tx) => {
      for (const match of ["equals", "equalsOrUnset"] as const) {
        const blueprint = new BlueprintRecord(table, false, [], type);
        blueprint.rowLevelSecurity("scope_id", { setting, match });
        const create = blueprint
          .compile(schema)
          .statements.find((statement) => statement.sql.startsWith(`create policy ${generated} `));
        if (create === undefined) continue;
        // raw-sql: the generated policy under the probe's name, rolled back below; names are quoted identifiers
        await tx.execute(
          create.sql.replace(`create policy ${generated} `, `create policy ${SHAPE_PROBE} `),
        );
        // raw-sql: the catalogue's text of the probe policy just created
        const [shape] = (await tx.execute(
          `select coalesce(pg_get_expr(polqual, polrelid), '') as "using",
             coalesce(pg_get_expr(polwithcheck, polrelid), '') as "check"
           from pg_policy where polrelid = ?::regclass and polname = ?`,
          [qualified, SHAPE_PROBE],
        )) as { using: string; check: string }[];
        if (shape !== undefined) shapes.push(shape);
        // raw-sql: drops the probe policy before the next match's; the whole transaction rolls back anyway
        await tx.execute(`drop policy ${SHAPE_PROBE} on ${qualified}`);
      }
      throw new ProbeDone();
    });
  } catch (error) {
    // A generated policy the table cannot take (a column type it does not cast to) is no shape it can match.
    if (!(error instanceof ProbeDone)) return [];
  }
  return shapes;
}

/** The tables of every schema the service owns: no system schema, no table an extension made. */
const TABLES = `select n.nspname as schema, c.relname as "table", c.relispartition as partition,
    c.relrowsecurity as enabled, c.relforcerowsecurity as forced
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where c.relkind in ('r', 'p') and n.nspname <> 'information_schema' and n.nspname not like 'pg\\_%'
    and not exists (select 1 from pg_depend d where d.classid = 'pg_class'::regclass and d.objid = c.oid and d.deptype = 'e')
  order by 1, 2`;

const POLICIES = `select n.nspname as schema, c.relname as "table", p.polname as name, p.polpermissive as permissive,
    p.polcmd::text as command, coalesce(pg_get_expr(p.polqual, p.polrelid), '') as "using",
    coalesce(pg_get_expr(p.polwithcheck, p.polrelid), '') as "check",
    array_to_string(array(select case when r = 0 then 'public' else pg_get_userbyid(r) end
      from unnest(p.polroles) r order by 1), ',') as roles
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
  owners: readonly (string | null)[],
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
    await tx.execute(
      `insert into ${name} (${into}) values ${owners.map(() => row).join(", ")}`,
      [...owners],
      "run",
    );
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
 * @returns the warnings: none, unless `options.strict` is `false` (the audit's own tests), when each unlisted table
 *          without the owner column is returned with its group instead of failing.
 * @throws Error listing every gap: an unlisted table without the owner column, a listed one with it, an
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
  const strict = options.strict ?? true;
  const warnings: string[] = [];
  const [own, other] = probe;
  // The compiled migrations' `t.platformTable` and `t.reviewedPolicy` declarations, when the caller names them.
  const declared = tableDeclarations(
    options.migrationsDirectory === undefined
      ? ""
      : readMigrationFiles(options.migrationsDirectory)
          .map((file) => file.sql)
          .join("\n"),
  );
  const platform = new Map([...PLATFORM_TABLES, ...(options.platform ?? []), ...declared.platform]);
  const em = database.em();
  const gaps: string[] = [];
  const allPolicies = (await em.execute(POLICIES)) as RolePolicyRow[];
  // The system-access policies are held to their own shape by systemAccessGaps, not to the owner checks.
  const policies = allPolicies.filter((policy) => !isSystemAccessPolicy(policy));
  const columns = (await em.execute(COLUMNS)) as ColumnRow[];
  const tables: AuditedTable[] = [];
  for (const table of (await em.execute(TABLES)) as Omit<AuditedTable, "owned" | "column">[]) {
    const name = `${table.schema}.${table.table}`;
    const holds = (owner: string) => of(columns, table).some((known) => known.name === owner);
    // Group (b) by name: a table in ISOLATION_SCOPE_TABLES is owned through its own column, against the same setting.
    let owner = ISOLATION_SCOPE_TABLES.get(name) ?? column;
    // Group (b) by shape: a scope_id whose one policy is exactly the generated equality on the setting (`equals` or
    // `equalsOrUnset`) is the table's owner column (core payments' tables). Any other shape stays unowned.
    const equality = of(policies, table).find(
      (policy) => policy.name === `pol_${table.table}_scope_id`,
    );
    const scope = of(columns, table).find((known) => known.name === "scope_id");
    if (
      !holds(owner) &&
      !platform.has(name) &&
      !declared.reviewed.has(name) &&
      scope !== undefined &&
      equality !== undefined &&
      equality.permissive &&
      equality.command === "*" &&
      (await scopeEqualities(em, table.schema, table.table, scope.type, setting)).some(
        (shape) => shape.using === equality.using && shape.check === equality.check,
      )
    )
      owner = "scope_id";
    tables.push({ ...table, owned: holds(owner), column: owner });
  }

  const owned: AuditedTable[] = [];
  // The platform-form tables (ADR 0239 amendment, gap C): their NULL rows are the platform's, which every session reads.
  const platformForm = new Set<AuditedTable>();
  for (const audited of tables) {
    const name = `${audited.schema}.${audited.table}`;
    const reason = platform.get(name);
    const review = declared.reviewed.get(name);
    // A reviewed table keeps its hand-written policies, but never without row-level security or a named policy.
    if (review !== undefined) {
      if (reason !== undefined)
        gaps.push(`${name} is declared both a platform table and a reviewed policy`);
      if (review.reason === "") gaps.push(`${name}: t.reviewedPolicy has no reason`);
      if (!audited.enabled)
        gaps.push(`${name} is a reviewed policy table but does not enable row-level security`);
      if (!audited.forced)
        gaps.push(`${name} is a reviewed policy table but does not force row-level security`);
      for (const policy of review.policies)
        if (!of(policies, audited).some((known) => known.name === policy))
          gaps.push(`${name}: t.reviewedPolicy names ${policy}, which the table does not have`);
      continue;
    }
    if (!audited.owned) {
      const group = unownedTableGroup(audited.enabled, of(policies, audited), setting);
      const scopeEquality = group.startsWith("a scope_id table")
        ? `; its pol_${audited.table}_scope_id is not exactly the generated equals or equalsOrUnset policy, so it is not group (b)`
        : "";
      if (reason === undefined)
        (strict ? gaps : warnings).push(
          `${name} has no ${audited.column} column and is not a platform table (${group}${scopeEquality}); give it ${audited.column} or list it in \`platform\` with its reason`,
        );
      else if (reason.trim() === "")
        gaps.push(`${name} is listed as a platform table with no reason`);
      else if (declared.platform.has(name)) {
        const scoped = of(columns, audited).find((known) => SCOPE_COLUMNS.has(known.name));
        if (scoped !== undefined)
          gaps.push(
            `${name} is declared a platform table (t.platformTable) but holds ${scoped.name}`,
          );
      }
      continue;
    }
    if (reason !== undefined)
      gaps.push(`${name} is listed as a platform table but holds ${column}`);
    const tablePolicies = of(policies, audited);
    owned.push(audited);
    const owner = tablePolicies.find(
      (policy) => policy.name === `pol_${audited.table}_${audited.column}`,
    );
    if (owner !== undefined && new RegExp(`\\b${audited.column}\\b\\)? IS NULL`).test(owner.using))
      platformForm.add(audited);
    if (!audited.enabled) gaps.push(`${name} does not enable row-level security`);
    if (!audited.forced)
      gaps.push(`${name} does not force row-level security, so its owner role bypasses it`);
    gaps.push(
      ...policyGaps(
        name,
        audited.table,
        audited.column,
        setting,
        tablePolicies,
        of(columns, audited).map((known) => known.name),
        of(allPolicies, audited).some(
          (policy) => policy.name === `pol_${audited.table}_system_access_update`,
        ),
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

  gaps.push(...(await systemAccessGaps(em, allPolicies, declared, role)));

  for (const audited of owned) {
    const quotedColumn = quoteIdentifier(audited.column);
    const label = `${audited.schema}.${audited.table}`;
    const name = `${quoteIdentifier(audited.schema)}.${quoteIdentifier(audited.table)}`;
    try {
      await em.transactional(async (tx) => {
        // A partition gets its rows through its parent, whose seed lands in it when the key routes there.
        const unseeded = audited.partition
          ? undefined
          : await seedOwners(
              tx,
              name,
              of(columns, audited),
              audited.column,
              // A platform-form table also gets a platform row (NULL owner), which no owner may change.
              platformForm.has(audited) ? [...probe, null] : probe,
            );
        if (unseeded !== undefined)
          gaps.push(
            `${label}: could not seed a row of each probe owner, so no cross-owner read ran: ${unseeded}`,
          );
        // raw-sql: the probe reads as the role row-level security applies to
        await tx.execute(`set local role ${quotedRole}`);
        // raw-sql: the policy's session setting, unset; the setting name is a parameter
        await tx.execute("select set_config(?, '', true)", [setting]);
        // raw-sql: counts the owners' rows the policy shows with the setting unset (none; a NULL row is no owner's)
        const [unset] = (await tx.execute(
          `select count(*)::int as count from ${name} where ${quotedColumn} is not null`,
        )) as {
          count: number;
        }[];
        if ((unset?.count ?? 0) > 0)
          gaps.push(`${label}: a probe with ${setting} unset saw ${unset?.count} rows`);
        // raw-sql: the policy's session setting, set to one owner; both values are parameters
        await tx.execute("select set_config(?, ?, true)", [setting, own]);
        // raw-sql: counts the rows the policy shows that owner, its own and any other owner's
        const [seen] = (await tx.execute(
          `select count(*) filter (where ${quotedColumn} is distinct from ?${platformForm.has(audited) ? ` and ${quotedColumn} is not null` : ""})::int as others,
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
        if (platformForm.has(audited))
          for (const [verb, sql, params] of [
            [
              "changed",
              `update ${name} set ${quotedColumn} = ? where ${quotedColumn} is null`,
              [own],
            ],
            ["deleted", `delete from ${name} where ${quotedColumn} is null`, []],
          ] as const)
            try {
              // raw-sql: a savepoint, so a write the policy refuses does not abort the probe's transaction
              await tx.execute("savepoint stackra_probe");
              // raw-sql: tries to take over or delete the platform's rows; the write policies must refuse it
              const written = (await tx.execute(sql, [...params], "run")) as {
                affectedRows?: number;
              };
              if ((written.affectedRows ?? 0) > 0)
                gaps.push(
                  `${label}: a probe as ${own} ${verb} ${written.affectedRows} platform rows (NULL ${audited.column})`,
                );
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
