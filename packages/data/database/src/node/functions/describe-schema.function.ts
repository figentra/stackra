/**
 * Stackra file contract:
 * Purpose: `describeSchema(options)`, `stackra db:schema` and the `db_schema` tool of the local developer MCP: every
 *          table of the member's database outside the system schemas (narrowed to one schema or one table), with its
 *          columns, primary key, indexes, row-level security (enabled, forced) and policies.
 * Boundary: reads the Postgres catalogue only, in a read-only transaction (`openInspectionSession`), never a table's
 *           rows. Local dev and the testbed only (`inspectionTarget`). Partitions are folded into their parent table.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5: query the local database); `.agents/rules/tenancy.md` (point 2: every
 *                     tenant-owned table has ENABLE and FORCE ROW LEVEL SECURITY); STA-2906.
 */
import { inspectionTarget } from "#node/functions/inspection-target.function";
import { openInspectionSession } from "#node/functions/open-inspection-session.function";
import type { SchemaColumn } from "#node/types/schema-column.type";
import type { SchemaDescription } from "#node/types/schema-description.type";
import type { SchemaPolicy } from "#node/types/schema-policy.type";
import type { SchemaTable } from "#node/types/schema-table.type";

/** The system schemas a member never owns. */
const SYSTEM_SCHEMAS =
  "n.nspname not in ('pg_catalog', 'information_schema') and n.nspname not like 'pg\\_%'";

/** The tables to describe: ordinary and partitioned, never a partition, in the schema and table asked for. */
const TABLES = `select c.oid::int as oid, n.nspname as schema, c.relname as name, c.relrowsecurity as enabled,
  c.relforcerowsecurity as forced
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where c.relkind in ('r', 'p') and not c.relispartition and ${SYSTEM_SCHEMAS}
    and ($1::text is null or n.nspname = $1) and ($2::text is null or c.relname = $2)
  order by n.nspname, c.relname`;

/** The columns of the tables, in order. */
const COLUMNS = `select a.attrelid::int as oid, a.attname as name, format_type(a.atttypid, a.atttypmod) as type,
  not a.attnotnull as nullable, pg_get_expr(d.adbin, d.adrelid) as "default"
  from pg_attribute a left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
  where a.attrelid = any($1::int[]) and a.attnum > 0 and not a.attisdropped
  order by a.attrelid, a.attnum`;

/** The indexes of the tables; `primary` marks the primary key's, whose columns are listed in key order. */
const INDEXES = `select i.indrelid::int as oid, c.relname as name, pg_get_indexdef(i.indexrelid) as definition,
  i.indisprimary as "primary",
  array(select a.attname from unnest(i.indkey) with ordinality k(attnum, position)
    join pg_attribute a on a.attrelid = i.indrelid and a.attnum = k.attnum order by k.position)::text[] as columns
  from pg_index i join pg_class c on c.oid = i.indexrelid
  where i.indrelid = any($1::int[])
  order by i.indrelid, c.relname`;

/** The row-level security policies of the tables. */
const POLICIES = `select p.polrelid::int as oid, p.polname as name,
  case p.polcmd when 'r' then 'SELECT' when 'a' then 'INSERT' when 'w' then 'UPDATE' when 'd' then 'DELETE'
    else 'ALL' end as command,
  p.polpermissive as permissive,
  case when p.polroles = '{0}' then array['public']
    else array(select r.rolname from pg_roles r where r.oid = any(p.polroles) order by r.rolname) end::text[] as roles,
  pg_get_expr(p.polqual, p.polrelid) as using, pg_get_expr(p.polwithcheck, p.polrelid) as "check"
  from pg_policy p where p.polrelid = any($1::int[])
  order by p.polrelid, p.polname`;

/**
 * Describes the member's tables.
 *
 * @param options - `schema` and `table` narrow the answer; `env` is the environment, `process.env` by default.
 * @throws InspectionRefusedError outside local dev and the testbed (`inspectionTarget`).
 * @example
 * const { tables } = await describeSchema({ schema: "notes" });
 * tables[0]?.rowSecurity; // { enabled: true, forced: true }
 */
export async function describeSchema(
  options: {
    readonly schema?: string | undefined;
    readonly table?: string | undefined;
    readonly env?: Readonly<Record<string, string | undefined>> | undefined;
  } = {},
): Promise<SchemaDescription> {
  const { url, environment } = inspectionTarget(options.env);
  const schema = options.schema || null;
  const table = options.table || null;
  return openInspectionSession(url, async ({ execute, extended }) => {
    // raw-sql: catalogue reads; the inspection reads no table's rows
    const [who] = await execute("select current_user as role");
    const tables = await extended(TABLES, [schema, table]);
    const oids = tables.map((row) => Number(row["oid"]));
    const [columns, indexes, policies] = [
      await extended(COLUMNS, [oids]),
      await extended(INDEXES, [oids]),
      await extended(POLICIES, [oids]),
    ];
    return {
      environment,
      role: String(who?.["role"] ?? ""),
      tables: tables.map((row): SchemaTable => {
        const oid = Number(row["oid"]);
        const own = (rows: typeof columns) => rows.filter((entry) => Number(entry["oid"]) === oid);
        return {
          schema: String(row["schema"]),
          name: String(row["name"]),
          columns: own(columns).map((column): SchemaColumn => ({
            name: String(column["name"]),
            type: String(column["type"]),
            nullable: column["nullable"] === true,
            default: textOrNull(column["default"]),
          })),
          primaryKey: own(indexes)
            .filter((index) => index["primary"] === true)
            .flatMap((index) => (index["columns"] as string[] | null) ?? []),
          indexes: own(indexes).map((index) => ({
            name: String(index["name"]),
            definition: String(index["definition"]),
          })),
          rowSecurity: { enabled: row["enabled"] === true, forced: row["forced"] === true },
          policies: own(policies).map((policy): SchemaPolicy => ({
            name: String(policy["name"]),
            command: String(policy["command"]),
            permissive: policy["permissive"] === true,
            roles: (policy["roles"] as string[] | null) ?? [],
            using: textOrNull(policy["using"]),
            check: textOrNull(policy["check"]),
          })),
        };
      }),
    };
  });
}

/** A text cell, or null. */
function textOrNull(value: unknown): string | null {
  return value === null || value === undefined ? null : String(value);
}
