/**
 * Stackra file contract:
 * Purpose: `databaseScript(databases)`, the shell script the tools stack's one-shot database task runs against the
 *          environment's shared Postgres server: per tool, create its login role if missing and set its password,
 *          let the admin act as it, create its database owned by it if missing, then create its extensions.
 * Boundary: internal; `awsToolsStack` puts it in the task's command. Idempotent, so the deploy may run it on every
 *           release. The admin login comes from libpq variables (`PGHOST`, `PGUSER`, `PGPASSWORD`) and each password
 *           from `DB_PASSWORD_<NAME>`, both injected from SSM; psql quotes every name and value (`%I`, `%L`), so no
 *           value is spliced into SQL text and none is printed.
 * Runtime: node
 * Governing contract: ADR 0444; ADR 0238 (one database and one role per service); ADR 0173 (no secret values).
 */
import type { ToolDatabase } from "#core/types/tool-database.type";
import { databasePasswordVariable } from "#node/functions/database-password-variable.function";

/**
 * The idempotent provisioning script for `databases`.
 *
 * @example
 * databaseScript([{ tool: "chatwoot", name: "chatwoot", extensions: ["vector"], passwordParameter: "/p" }]);
 */
export function databaseScript(databases: readonly ToolDatabase[]): string {
  const steps = databases.map((database) =>
    [
      `psql -v ON_ERROR_STOP=1 -d postgres -v db=${database.name} -v pw="$${databasePasswordVariable(database.name)}" <<'SQL'`,
      "SELECT format('CREATE ROLE %I LOGIN', :'db') WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = :'db')\\gexec",
      "SELECT format('ALTER ROLE %I PASSWORD %L', :'db', :'pw')\\gexec",
      "SELECT format('GRANT %I TO CURRENT_USER', :'db')\\gexec",
      "SELECT format('CREATE DATABASE %I OWNER %I', :'db', :'db') WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = :'db')\\gexec",
      "SQL",
      ...(database.extensions.length === 0
        ? []
        : [
            `psql -v ON_ERROR_STOP=1 -d ${database.name} <<'SQL'`,
            ...database.extensions.map(
              (extension) => `CREATE EXTENSION IF NOT EXISTS "${extension}";`,
            ),
            "SQL",
          ]),
    ].join("\n"),
  );
  return ["set -eu", ...steps].join("\n");
}
