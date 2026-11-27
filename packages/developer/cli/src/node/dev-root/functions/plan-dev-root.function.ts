/**
 * Stackra file contract:
 * Purpose: `planDevRoot(root, options)`, the plan of root `stackra dev`: the lane from the root runway (`devLane`:
 *          `STACKRA_LANE`, else the repository's row of `lanes.repos`), the dev facts written for it
 *          (`writeDevFacts`, `.stackra/dev/ports.json`), the gateway port of the one `encore run`
 *          (`environments.dev.infra.gateway.port`, 4000 when unset, lane applied), every service member gen wrote an
 *          Encore app for, with its dev port, database, migrations and seeders, the member ports to forward to the
 *          gateway (each service member's dev port other than the gateway's) and the seed profile.
 * Boundary: reads the repository and writes only the dev facts file. Run after gen, since the Encore app, the
 *           database declaration, the migrations and the seed entry are gen's outputs. Refuses an unknown seed
 *           profile.
 * Runtime: node
 * Governing contract: ADR 0296 (decisions 1 and 3); ADR 0091 (decision 2); ADR 0190 (profiles); STA-863; STA-2664
 *                     (items 1, 2, 5 and 8); STA-2840.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { devLane } from "@stackra/runway";
import { writeDevFacts } from "@stackra/runway/node";
import { parse } from "yaml";

import { SEED_PROFILES } from "#node/constants/seed-profiles.constant";
import type { DevRootPlan } from "#node/dev-root/types/dev-root-plan.type";
import type { DevRootService } from "#node/dev-root/types/dev-root-service.type";
import { encoreMembers } from "#node/dev-root/functions/encore-members.function";
import { CliUsageError } from "#node/errors/cli-usage.error";

/** The gateway port when the root runway's dev infra names none (`encore run`'s own default). */
const DEFAULT_GATEWAY = 4000;

/** The database a generated Encore service declares: `new SQLDatabase("orders", …)`. */
const DATABASE = /new\s+SQLDatabase\(\s*["']([^"']+)["']/;

/** The first database declared in a TypeScript file under `folder`. */
function databaseUnder(folder: string): string | undefined {
  if (!existsSync(folder)) return undefined;
  for (const entry of readdirSync(folder, { withFileTypes: true })) {
    const path = join(folder, entry.name);
    if (entry.isDirectory() && entry.name !== "node_modules") {
      const found = databaseUnder(path);
      if (found !== undefined) return found;
    } else if (entry.isFile() && entry.name.endsWith(".ts")) {
      const match = DATABASE.exec(readFileSync(path, "utf8"));
      if (match !== null) return match[1];
    }
  }
  return undefined;
}

/** Whether `folder` holds at least one file. */
const hasFiles = (folder: string): boolean => existsSync(folder) && readdirSync(folder).length > 0;

/**
 * Plans the root dev run of the repository at `root`.
 *
 * @param root - the repository root (it holds `runway.yaml`).
 * @param options - `seed`: the profile (`demo` by default; `none` runs no seeders); `env`: the variables the lane is
 *                  read from.
 * @throws CliUsageError for an unknown seed profile.
 * @throws RunwayUnresolvedError when the lane variable is not a whole number.
 * @example
 * const plan = planDevRoot("/work/acme", { env: process.env });
 * plan.gateway; // 4000 on lane 0
 */
export function planDevRoot(
  root: string,
  options: {
    readonly seed?: string | undefined;
    readonly env: Readonly<Record<string, string | undefined>>;
  },
): DevRootPlan {
  const seed = options.seed ?? "demo";
  if (seed !== "none" && !Object.hasOwn(SEED_PROFILES, seed))
    throw new CliUsageError(
      `unknown seed profile: ${seed} (expected ${[...Object.keys(SEED_PROFILES), "none"].join(", ")})`,
    );
  const runway = (parse(readFileSync(join(root, "runway.yaml"), "utf8")) ?? {}) as Parameters<
    typeof devLane
  >[0];
  const lane = devLane(runway, options.env);
  const facts = writeDevFacts(root, lane);
  const gateway =
    facts.infra["gateway"]?.port ??
    DEFAULT_GATEWAY +
      lane *
        ((runway as { environments?: { dev?: { lanes?: { portStep?: number } } } }).environments
          ?.dev?.lanes?.portStep ?? 0);

  const services: DevRootService[] = encoreMembers(root).map((member) => {
    const key = member.slice(member.lastIndexOf("/") + 1);
    return {
      key,
      root: member,
      port: facts.members[key]?.port,
      database: databaseUnder(join(member, "stackra-encore")),
      migrations: hasFiles(join(member, ".stackra", "migrations")),
      seeders: existsSync(join(member, ".stackra", "entry", "seed.ts")),
    };
  });
  const forwards = services.flatMap(({ key, port }) =>
    port === undefined || port === gateway ? [] : [{ key, port }],
  );
  return { root, lane, gateway, services, forwards, ...(seed === "none" ? {} : { seed }) };
}
