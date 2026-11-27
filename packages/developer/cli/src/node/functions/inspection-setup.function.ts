/**
 * Stackra file contract:
 * Purpose: `inspectionSetup(io, member)`, where a `stackra db:schema`, `db:query` or `db:migrations:status` run reads:
 *          the member's folder (`--member`, relative to the run's folder) and the environment its inspection connects
 *          with. That is the process environment as it is when it names `DATABASE_DIRECT_URL` or `DATABASE_URL`, or
 *          when `STACKRA_ENVIRONMENT` names anything but `dev`; otherwise (local dev, nothing set) `DATABASE_URL` is
 *          the local Encore database's, from `encore db conn-uri <database>` in the member's folder, the database being
 *          the one gen declared in `stackra-encore/<member>/database.ts`.
 * Boundary: never prints or returns the connection string to the caller's output; it only travels in the environment
 *           handed to the member's inspection, which checks the environment and the host itself (`inspectionTarget`).
 *           Runs only `encore db conn-uri`, without a shell.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5: query the local database); ADR 0238 (one logical database per service);
 *                     STA-2906.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import type { CommandIo } from "@stackra/console";

import { CliUsageError } from "#node/errors/cli-usage.error";

/** The generated Encore database declaration: `new SQLDatabase("<name>", …)`. */
const SQL_DATABASE = /new SQLDatabase\(\s*"([^"]+)"/;

/** A Postgres connection string on a line of its own. */
const CONNECTION_STRING = /^postgres(?:ql)?:\/\/\S+$/;

/**
 * The member folder and the environment of an inspection.
 *
 * @param io - the run's io; its process runs `encore db conn-uri`.
 * @param member - the member's folder, relative to `io.cwd`.
 * @param env - the process environment, `process.env` by default.
 * @throws CliUsageError when the folder is not a member, or in local dev with no URL set the member has no generated
 *         Encore database or Encore has no local one running.
 * @example
 * const { cwd, env } = await inspectionSetup(io, "services/notes");
 */
export async function inspectionSetup(
  io: CommandIo,
  member: string,
  env: Readonly<Record<string, string | undefined>> = process.env,
): Promise<{ readonly cwd: string; readonly env: Readonly<Record<string, string | undefined>> }> {
  const cwd = resolve(io.cwd, member);
  if (!existsSync(join(cwd, "package.json")))
    throw new CliUsageError(
      `${member} is not a member folder (no package.json)`,
      "Pass --member with the service's folder, such as services/notes",
    );
  if (env["DATABASE_DIRECT_URL"] || env["DATABASE_URL"]) return { cwd, env };
  if ((env["STACKRA_ENVIRONMENT"] || "dev") !== "dev") return { cwd, env };
  const database = encoreDatabase(cwd);
  if (database === undefined)
    throw new CliUsageError(
      `${member} declares no Encore database (stackra-encore/*/database.ts)`,
      "Run `stackra gen` in a service with models, or set DATABASE_URL",
    );
  const { code, output } = await io.process.run("encore", ["db", "conn-uri", database], {
    cwd,
    check: false,
  });
  const url = output
    .split("\n")
    .map((line) => line.trim())
    .find((line) => CONNECTION_STRING.test(line));
  if (code !== 0 || url === undefined)
    throw new CliUsageError(
      `Encore has no local ${database} database to read`,
      "Start the app with `stackra dev`, or set DATABASE_URL",
    );
  return { cwd, env: { ...env, DATABASE_URL: url } };
}

/** The Encore database name gen declared for the member at `cwd`, or undefined. */
function encoreDatabase(cwd: string): string | undefined {
  const root = join(cwd, "stackra-encore");
  if (!existsSync(root)) return undefined;
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const file = join(root, entry.name, "database.ts");
    if (!entry.isDirectory() || !existsSync(file)) continue;
    const name = SQL_DATABASE.exec(readFileSync(file, "utf8"))?.[1];
    if (name !== undefined) return name;
  }
  return undefined;
}
