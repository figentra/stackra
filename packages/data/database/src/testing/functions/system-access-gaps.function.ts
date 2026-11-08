/**
 * Stackra file contract:
 * Purpose: `systemAccessGaps`, the system-access half of the row-level-security audit (ADR 0239 amendment, gap A): it
 *          holds `SYSTEM_ACCESS_ROLE` and everything that names it to the exact shape `t.systemAccess` and
 *          `schema.systemFunction` write. The role cannot log in, is no superuser, has no BYPASSRLS, is a member of no
 *          role, and no role can act as it: a membership with SET or INHERIT, or any membership of the service role,
 *          is a gap (PG 16+ gives a non-superuser that creates a role an ADMIN-only membership, which cannot act as
 *          it, so that one is allowed to any other role). A policy that names the role, or is named
 *          `pol_<table>_system_access_select` or `_update`, must be that permissive policy, `TO` the role only,
 *          `USING (true)` (`WITH CHECK (true)` for update), on a table that declares `t.systemAccess` (with update
 *          columns for the update policy). The role holds no table-level grant, only `SELECT` and `UPDATE` on the
 *          declared columns, and nothing on a schema but `USAGE`; it owns no table and no schema. Every function it owns
 *          is declared by `schema.systemFunction`, `SECURITY DEFINER`, with exactly `search_path=pg_catalog, pg_temp`,
 *          and executable only by the role, the migrating role and the service role, never `PUBLIC`; every declared
 *          function is owned by it. Last, a session as the service role tries `SET ROLE` to it, which must fail.
 * Boundary: test only; `assertRowSecurity` passes the catalogue's policies and the compiled migrations' declarations,
 *           and creates the service role first. It reads the catalogue as a superuser; the `SET ROLE` probe runs in a
 *           transaction it always rolls back, with the service role as its session user (`SET LOCAL SESSION
 *           AUTHORIZATION`), because Postgres checks `SET ROLE` against the session user, never the current role. With no role and no declaration there is nothing to audit.
 * Runtime: node
 * Governing contract: ADR 0239 (2026-11-07 amendment, gap A); ADR 0347 (decision 5: the catalogue audit).
 */
import { SYSTEM_ACCESS_ROLE } from "#core/constants/system-access-role.constant";
import type { tableDeclarations } from "#core/functions/table-declarations.function";
import { quoteIdentifier } from "#core/functions/quote-identifier.function";
import type { Database } from "#core/ports/database.port";
import { isSystemAccessPolicy } from "#testing/functions/is-system-access-policy.function";
import type { RolePolicyRow } from "#testing/types/role-policy-row.type";

/** The search path a system function pins, as the catalogue stores it. */
const PINNED_PATH = "search_path=pg_catalog, pg_temp";

/** Rolls the `SET ROLE` probe's transaction back once it has run. */
class ProbeDone extends Error {}

/**
 * The system-access gaps of the database.
 *
 * @param policies - every policy of the audited schemas, with its roles.
 * @param declared - the compiled migrations' declarations.
 * @param service - the role the service connects as.
 * @example
 * gaps.push(...(await systemAccessGaps(em, policies, declared, "stackra_app")));
 */
export async function systemAccessGaps(
  em: ReturnType<Database["em"]>,
  policies: readonly RolePolicyRow[],
  declared: ReturnType<typeof tableDeclarations>,
  service: string,
): Promise<string[]> {
  const role = SYSTEM_ACCESS_ROLE;
  // raw-sql: the system-access role's flags from the catalogue
  const [flags] = (await em.execute(
    "select rolsuper, rolbypassrls, rolcanlogin from pg_roles where rolname = ?",
    [role],
  )) as { rolsuper: boolean; rolbypassrls: boolean; rolcanlogin: boolean }[];
  const gaps: string[] = [];
  if (flags === undefined) {
    if (declared.systemAccess.size > 0 || declared.systemFunctions.size > 0)
      gaps.push(`role ${role} is missing, though the migrations declare system access`);
    return gaps;
  }
  if (flags.rolsuper) gaps.push(`role ${role} is a superuser`);
  if (flags.rolbypassrls) gaps.push(`role ${role} has BYPASSRLS`);
  if (flags.rolcanlogin) gaps.push(`role ${role} can log in`);

  // raw-sql: every membership the role takes part in, with its options (PG 16+)
  const memberships = (await em.execute(
    `select r.rolname as "role", m.rolname as member, am.admin_option as admin,
       am.inherit_option as inherit, am.set_option as "set"
     from pg_auth_members am
     join pg_roles r on r.oid = am.roleid
     join pg_roles m on m.oid = am.member
     where r.rolname = ? or m.rolname = ?`,
    [role, role],
  )) as { role: string; member: string; admin: boolean; inherit: boolean; set: boolean }[];
  for (const membership of memberships)
    if (membership.member === role)
      gaps.push(`role ${role} is a member of ${membership.role}, whose rights it would use`);
    else if (membership.member === service)
      gaps.push(`the service role ${service} holds a membership of ${role}`);
    else if (membership.set || membership.inherit)
      gaps.push(`role ${membership.member} is a member of ${role} (SET or INHERIT)`);

  for (const policy of policies.filter(isSystemAccessPolicy)) {
    const name = `${policy.schema}.${policy.table}`;
    const access = declared.systemAccess.get(name);
    const command = policy.name.endsWith("_update") ? "update" : "select";
    const expected = `pol_${policy.table}_system_access_${command}`;
    const shape =
      policy.name === expected &&
      policy.permissive &&
      policy.command === (command === "update" ? "w" : "r") &&
      policy.roles === role &&
      policy.using === "true" &&
      policy.check === (command === "update" ? "true" : "");
    if (!shape)
      gaps.push(
        `${name}: ${policy.name} (to ${policy.roles}) is not ${expected}, a permissive FOR ${command.toUpperCase()} TO ${role} USING (true) policy`,
      );
    else if (access === undefined)
      gaps.push(`${name}: ${policy.name} without a t.systemAccess declaration`);
    else if (command === "update" && access.update.length === 0)
      gaps.push(`${name}: ${policy.name}, though t.systemAccess declares no update column`);
  }

  // raw-sql: the role's grants on relations, columns and schemas, and what it owns, from the catalogue's ACLs
  const grants = (await em.execute(
    `select 'table' as kind, n.nspname || '.' || c.relname as "on", a.privilege_type as privilege
       from pg_class c join pg_namespace n on n.oid = c.relnamespace, aclexplode(c.relacl) a
       where a.grantee = to_regrole(?)
     union all
     select 'column', n.nspname || '.' || c.relname || '.' || t.attname, a.privilege_type
       from pg_attribute t join pg_class c on c.oid = t.attrelid join pg_namespace n on n.oid = c.relnamespace,
         aclexplode(t.attacl) a
       where a.grantee = to_regrole(?) and not t.attisdropped
     union all
     select 'schema', n.nspname, a.privilege_type
       from pg_namespace n, aclexplode(n.nspacl) a
       where a.grantee = to_regrole(?)
     union all
     select 'owned table', n.nspname || '.' || c.relname, ''
       from pg_class c join pg_namespace n on n.oid = c.relnamespace
       where c.relowner = to_regrole(?)
     union all
     select 'owned schema', n.nspname, '' from pg_namespace n where n.nspowner = to_regrole(?)`,
    [role, role, role, role, role],
  )) as { kind: string; on: string; privilege: string }[];
  for (const grant of grants) {
    if (grant.kind === "owned table" || grant.kind === "owned schema")
      gaps.push(`role ${role} owns the ${grant.kind.slice("owned ".length)} ${grant.on}`);
    else if (grant.kind === "table")
      gaps.push(
        `role ${role} holds ${grant.privilege} on all of ${grant.on}; t.systemAccess grants columns only`,
      );
    else if (grant.kind === "schema") {
      if (grant.privilege !== "USAGE")
        gaps.push(`role ${role} holds ${grant.privilege} on schema ${grant.on}`);
    } else {
      const dot = grant.on.lastIndexOf(".");
      const access = declared.systemAccess.get(grant.on.slice(0, dot));
      const column = grant.on.slice(dot + 1);
      const allowed =
        grant.privilege === "SELECT"
          ? access?.select
          : grant.privilege === "UPDATE"
            ? access?.update
            : undefined;
      if (allowed?.includes(column) !== true)
        gaps.push(
          `role ${role} holds ${grant.privilege} on ${grant.on}, which t.systemAccess does not declare`,
        );
    }
  }

  // raw-sql: the functions the role owns, with their definer flag, settings and executors
  const functions = (await em.execute(
    `select n.nspname || '.' || p.proname as name, p.oid::regprocedure::text as signature,
       p.prosecdef as definer, coalesce(array_to_string(p.proconfig, '|'), '') as config,
       case when p.proacl is null then 'public' else coalesce((
         select string_agg(case when a.grantee = 0 then 'public' else pg_get_userbyid(a.grantee) end, ',')
         from aclexplode(p.proacl) a where a.privilege_type = 'EXECUTE'), '') end as executors
     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where p.proowner = to_regrole(?)`,
    [role],
  )) as { name: string; signature: string; definer: boolean; config: string; executors: string }[];
  // raw-sql: the migrating role, the service's own, which the function's EXECUTE is granted to
  const [{ migrator = "" } = {}] = (await em.execute("select current_user as migrator")) as {
    migrator?: string;
  }[];
  for (const fn of functions) {
    if (!declared.systemFunctions.has(fn.name))
      gaps.push(`${fn.signature} is owned by ${role} but no schema.systemFunction declares it`);
    if (!fn.definer) gaps.push(`${fn.signature} is owned by ${role} but not SECURITY DEFINER`);
    if (fn.config !== PINNED_PATH)
      gaps.push(`${fn.signature} does not pin ${PINNED_PATH} (it sets "${fn.config}")`);
    for (const executor of fn.executors.split(",").filter(Boolean))
      if (executor === "public") gaps.push(`${fn.signature}: PUBLIC may execute it`);
      else if (![role, migrator, service].includes(executor))
        gaps.push(`${fn.signature}: ${executor} may execute it; only the service may`);
  }
  for (const name of declared.systemFunctions.keys())
    if (!functions.some((fn) => fn.name === name))
      gaps.push(`${name} is declared by schema.systemFunction but not owned by ${role}`);

  // The probe: a session as the service role cannot become the system-access role.
  try {
    await em.transactional(async (tx) => {
      // raw-sql: the probe's session user is the service role, since SET ROLE is checked against the session user
      await tx.execute(`set local session authorization ${quoteIdentifier(service)}`);
      try {
        // raw-sql: a savepoint, so the refused SET ROLE does not abort the probe's transaction
        await tx.execute("savepoint stackra_probe");
        // raw-sql: tries to become the system-access role, which must be refused
        await tx.execute(`set local role ${quoteIdentifier(role)}`);
        gaps.push(`the service role ${service} can SET ROLE ${role}`);
      } catch {
        // Refused, as it must be.
      }
      throw new ProbeDone();
    });
  } catch (error) {
    if (!(error instanceof ProbeDone))
      gaps.push(`the SET ROLE probe of ${role} failed: ${String(error)}`);
  }
  return gaps;
}
