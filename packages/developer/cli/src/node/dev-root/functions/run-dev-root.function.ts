/**
 * Stackra file contract:
 * Purpose: `runDevRoot(context, tools?)`, `stackra dev` at the root of a product with service members: runs gen on
 *          every service member, plans the run (`planDevRoot`: the lane from the root runway, the dev facts, the
 *          gateway), builds the local monolith app (`syncDevEncoreApp`) and keeps it current (`watchDevMembers`),
 *          starts ONE `encore run --port=<gateway> --browser=never` in it with every member's dev secrets, forwards each
 *          service member's dev port to the gateway, migrates and seeds every member's database once the gateway
 *          answers (`prepareDevData`), and fans the other members out through `turbo run dev
 *          --filter=!./services/*` (apps, packages, the docs site and the Workers under `workers/`, each on its lane's
 *          runway dev port).
 * Boundary: dispatch and lifetime only. The run ends when `encore run` ends (a product without its backend is not
 *           running), when the fan-out fails, or on SIGINT or SIGTERM; then the other processes get SIGTERM and the
 *           watch, the gateway wait and the forwards stop. Resolves with the first non-zero exit code of `encore run`,
 *           the fan-out or the data step. The Encore app id is the
 *           members' one (`encore.app`), so the run shares their local databases.
 * Runtime: node
 * Governing contract: ADR 0296 (decision 3: a monolith is one process allocation of the one app; decision 1: lanes);
 *                     ADR 0289 (decision 5: one Encore app); ADR 0091 (decision 2); ADR 0284 (Workers); STA-2664
 *                     (items 1, 2, 5, 8 and 9); STA-2840.
 */
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { syncDevEncoreApp } from "@stackra/runway/node";

import { devSecretEnv } from "#node/dev-secrets/functions/dev-secret-env.function";
import { DEV_ROOT_TOOLS } from "#node/dev-root/constants/dev-root-tools.constant";
import { encoreMembers } from "#node/dev-root/functions/encore-members.function";
import { planDevRoot } from "#node/dev-root/functions/plan-dev-root.function";
import { prepareDevData } from "#node/dev-root/functions/prepare-dev-data.function";
import { watchDevMembers } from "#node/dev-root/functions/watch-dev-members.function";
import type { DevRootTools } from "#node/dev-root/types/dev-root-tools.type";
import type { PortForward } from "#node/dev-root/types/port-forward.type";
import { runGen } from "#node/functions/run-gen.function";
import type { CliContext } from "#node/types/cli-context.type";

/** The service members gen runs on: `services/<key>` with a `stackra.config.ts`. */
const serviceSources = (root: string, folders: readonly string[]): string[] =>
  folders.filter((member) => existsSync(join(root, member, "stackra.config.ts")));

/**
 * Runs the product at `context.cwd` locally and resolves with the exit code.
 *
 * @param context - the command context; `values.seed` picks the seed profile (`demo` by default, `none` for none).
 * @param tools - the processes and sockets it starts (the real ones by default).
 * @example
 * await runDevRoot({ ...context, values: { seed: "minimal" } });
 */
export async function runDevRoot(
  context: CliContext,
  tools: DevRootTools = DEV_ROOT_TOOLS,
): Promise<number> {
  const { cwd: root, io, values } = context;
  const folders = existsSync(join(root, "services"))
    ? readdirSync(join(root, "services"), { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => join("services", entry.name))
    : [];
  for (const member of serviceSources(root, folders))
    if (!(await runGen(join(root, member), { base: root }, io))) return 1;

  const plan = planDevRoot(root, {
    seed: typeof values["seed"] === "string" ? values["seed"] : undefined,
    env: process.env,
  });
  const members = encoreMembers(root);
  if (members.length === 0) {
    io.err(
      "stackra dev: gen wrote no Encore app for any service member (services/<key>/encore.app)\n",
    );
    return 1;
  }
  const request = { repository: root, members };
  const app = syncDevEncoreApp(request);
  io.out(
    `stackra dev: one Encore app of ${app.members.join(", ")} on http://localhost:${plan.gateway} (lane ${plan.lane})\n`,
  );
  const watcher = watchDevMembers(request, io);
  const forwards: PortForward[] = [];
  try {
    for (const { key, port } of plan.forwards) {
      try {
        forwards.push(await tools.forward(port, plan.gateway));
        io.out(`stackra dev: ${key} on http://localhost:${port} → the gateway\n`);
      } catch (error) {
        io.err(`stackra dev: ${key}: ${error instanceof Error ? error.message : String(error)}\n`);
      }
    }
    // Every member's dev secrets: the one process boots them all.
    const secrets = Object.assign({}, ...members.map((member) => devSecretEnv(member))) as Record<
      string,
      string
    >;
    // Whatever ends the run stops the rest: encore exiting, the fan-out failing, or the developer's Ctrl-C.
    const ended = new AbortController();
    const end = (): void => ended.abort();
    process.once("SIGINT", end);
    process.once("SIGTERM", end);
    const lane = String(plan.lane);
    try {
      const codes = await Promise.all([
        tools
          .run(
            {
              command: "encore",
              args: ["run", `--port=${plan.gateway}`, "--browser=never"],
              cwd: app.root,
              env: { ...secrets, STACKRA_LANE: lane },
              signal: ended.signal,
            },
            io,
          )
          .finally(end),
        tools
          .run(
            {
              command: "turbo",
              args: ["run", "dev", "--filter=!./services/*"],
              cwd: root,
              env: { STACKRA_LANE: lane },
              signal: ended.signal,
            },
            io,
          )
          .then((code) => {
            if (code !== 0) end();
            return code;
          }),
        prepareDevData(plan, app.root, tools, io, { signal: ended.signal }),
      ]);
      return codes.find((code) => code !== 0) ?? 0;
    } finally {
      process.off("SIGINT", end);
      process.off("SIGTERM", end);
    }
  } finally {
    watcher.close();
    await Promise.all(forwards.map((forward) => forward.close()));
  }
}
