/**
 * Stackra file contract:
 * Purpose: `prepareDevData(plan, app, tools, io)`, the data step of root `stackra dev`: once the gateway answers, for
 *          each service member with a database it asks Encore for the database's connection string (`encore db conn-uri`
 *          in the app root), then runs the member's own `stackra db migrate --env dev` (when gen compiled migrations; a
 *          file Encore already applied is adopted, never applied twice) and `stackra db seed --profile <seed> --env dev`
 *          (when it has seeders and a profile is set), so a fresh clone boots with its schema and data.
 * Boundary: runs each member's commands in the member folder with `DATABASE_URL` set for that one process; the
 *           connection string is never printed. A database whose connection string is not on this machine
 *           (`isLocalDatabaseUrl`) is refused and named: no migration or seeder runs against it. A member that fails is named and the others still run; the answer is
 *           the first non-zero exit code, or 0. Answers 1 without touching a database when the gateway never answered,
 *           and 0 without a word when the run ended first (`options.signal`).
 * Runtime: node
 * Governing contract: ADR 0159 (decision 2: `stackra db migrate`); ADR 0190 (profiles); ADR 0325 (decision 7);
 *                     STA-1709; STA-2664 (item 5); STA-2840.
 */
import { isLocalDatabaseUrl } from "#node/dev-root/functions/is-local-database-url.function";
import type { DevRootPlan } from "#node/dev-root/types/dev-root-plan.type";
import type { DevRootTools } from "#node/dev-root/types/dev-root-tools.type";
import type { CliIo } from "#node/types/cli-io.type";

/** How long the gateway may take to build and start the app before the data step gives up. */
const GATEWAY_TIMEOUT_MS = 10 * 60 * 1000;

/**
 * Migrates and seeds every service member's database once the app is up.
 *
 * @param plan - the root dev plan.
 * @param app - the local monolith app root, where `encore db conn-uri` runs.
 * @param tools - the process runner, the output capture and the gateway wait.
 * @param io - where progress is written.
 * @param options - `timeoutMs`: how long the gateway may take (10 minutes); `signal`: the run ending stops the wait.
 * @returns 0, or the first non-zero exit code.
 * @example
 * await prepareDevData(plan, app.root, tools, io);
 */
export async function prepareDevData(
  plan: DevRootPlan,
  app: string,
  tools: Pick<DevRootTools, "run" | "capture" | "waitFor">,
  io: CliIo,
  options: { readonly timeoutMs?: number; readonly signal?: AbortSignal } = {},
): Promise<number> {
  const { timeoutMs = GATEWAY_TIMEOUT_MS, signal } = options;
  const members = plan.services.filter(
    (service) =>
      service.database !== undefined &&
      (service.migrations || (service.seeders && plan.seed !== undefined)),
  );
  if (members.length === 0) return 0;
  if (!(await tools.waitFor(`http://localhost:${plan.gateway}/`, timeoutMs, signal))) {
    if (signal?.aborted === true) return 0;
    io.err(
      `stackra dev: the gateway on port ${plan.gateway} did not answer; no migration or seeder ran\n`,
    );
    return 1;
  }
  let code = 0;
  for (const service of members) {
    let url: string;
    try {
      url = (
        await tools.capture("encore", ["db", "conn-uri", service.database as string], { cwd: app })
      ).trim();
    } catch (error) {
      io.err(
        `stackra dev: ${service.key}: no connection string for database ${service.database}: ${error instanceof Error ? error.message : String(error)}\n`,
      );
      code ||= 1;
      continue;
    }
    if (!isLocalDatabaseUrl(url)) {
      io.err(
        `stackra dev: ${service.key}: database ${service.database} is not on this machine; the dev data step migrates and seeds local databases only\n`,
      );
      code ||= 1;
      continue;
    }
    const env = { DATABASE_URL: url, STACKRA_ENVIRONMENT: "dev" };
    const steps = [
      ...(service.migrations ? [["db", "migrate", "--env", "dev"]] : []),
      ...(service.seeders && plan.seed !== undefined
        ? [["db", "seed", "--profile", plan.seed, "--env", "dev"]]
        : []),
    ];
    for (const args of steps) {
      const exit = await tools.run({ command: "stackra", args, cwd: service.root, env }, io);
      if (exit !== 0) {
        io.err(`stackra dev: ${service.key}: stackra ${args.join(" ")} exited ${exit}\n`);
        code ||= exit;
        break;
      }
    }
  }
  if (code === 0)
    io.out(`stackra dev: migrated and seeded ${members.map((m) => m.key).join(", ")}\n`);
  return code;
}
