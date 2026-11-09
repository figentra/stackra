/**
 * Stackra file contract:
 * Purpose: `readLaunchInputs(root)`, the launch file's inputs from a repository: the root runway's web surfaces in
 *          declaration order and every `apps/` and `workers/` member whose runway declares a dev port
 *          (`environments.dev.port`, else `environments.dev.mobile.metroPort`), with its package name and whether it
 *          is a Worker (`wrangler.jsonc`).
 * Boundary: reads the runway files (`readRunways`), each member's `package.json` and the folder; never validates a
 *           runway (that is `checkRunwayFiles`). Services are left out until gen writes their Encore dev command.
 * Runtime: node
 * Governing contract: ADR 0296 (decision 1); ADR 0441 (decision 3); ADR 0284 (`workers/`); STA-2081.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { readRunways } from "@stackra/runway/node";

import type { LaunchInputs } from "#node/launch-config/types/launch-inputs.type";
import type { LaunchMember } from "#node/launch-config/types/launch-member.type";

/** The member roots that run a dev server Claude can open. */
const SERVED_ROOTS = new Set(["apps", "workers"]);

/** The CLI member in core; a product runs the installed `stackra` instead. */
const CLI_DIR = "packages/developer/cli";

/** The dev environment of a parsed member runway. */
type DevEnvironment = {
  readonly port?: unknown;
  readonly mobile?: { readonly metroPort?: unknown };
};

/**
 * The launch inputs of the repository at `root`.
 *
 * @example
 * readLaunchInputs(root).members.map((member) => member.key); // ["docs", "mobile"]
 */
export function readLaunchInputs(root: string): LaunchInputs {
  const runways = readRunways(root);
  const surfaces = Object.keys(
    (runways.root as { readonly surfaces?: Record<string, unknown> } | null)?.surfaces ?? {},
  ).filter((key) => key !== "ops");
  const members: LaunchMember[] = [];
  for (const { member, folder, runway } of runways.members) {
    if (folder === undefined || !SERVED_ROOTS.has(folder)) continue;
    const dev = (runway as { readonly environments?: { readonly dev?: DevEnvironment } } | null)
      ?.environments?.dev;
    const port = dev?.port ?? dev?.mobile?.metroPort;
    if (typeof port !== "number") continue;
    const dir = join(root, folder, member);
    const { name } = JSON.parse(readFileSync(join(dir, "package.json"), "utf8")) as {
      readonly name: string;
    };
    members.push({ key: member, name, port, worker: existsSync(join(dir, "wrangler.jsonc")) });
  }
  return {
    surfaces,
    members,
    cli: existsSync(join(root, CLI_DIR, "package.json")) ? "local" : "installed",
  };
}
