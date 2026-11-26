/**
 * Stackra file contract:
 * Purpose: `createServiceRole(schema)` makes the guides' service role once and grants it one schema's tables, so a
 *          test on PGlite (whose session user is a superuser, which row-level security never restricts) can be held to
 *          the tenant policy as a deployed service is.
 * Boundary: test support only, under `scripts/guides`; runs on the connected database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0239; ADR 0347 (decision 5: prove a policy as a role without BYPASSRLS); STA-2843.
 */
import { Database } from "@stackra/database";

import { SERVICE_ROLE } from "./service-role";

/**
 * Creates the service role once and grants it `schema`'s tables.
 *
 * @example
 * await createServiceRole("support");
 */
export async function createServiceRole(schema: string): Promise<void> {
  const em = Database.current().em();
  // raw-sql: test setup of a role, as assertRowSecurity creates its own
  await em.execute(
    `do $$ begin if not exists (select from pg_roles where rolname = '${SERVICE_ROLE}') then create role ${SERVICE_ROLE} nologin nobypassrls; end if; end $$`,
  );
  // raw-sql: the role may reach the schema, as a service's database user may
  await em.execute(`grant usage on schema "${schema}" to ${SERVICE_ROLE}`);
  // raw-sql: and read and write its tables, which it does not own
  await em.execute(
    `grant select, insert, update, delete on all tables in schema "${schema}" to ${SERVICE_ROLE}`,
  );
}
