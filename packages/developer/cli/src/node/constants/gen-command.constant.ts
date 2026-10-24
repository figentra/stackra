/**
 * Stackra file contract:
 * Purpose: `GEN_COMMAND`, `stackra gen [--check] [--backend tsgo|ts6]`: gen-core over the member in the working
 *          directory, or at the workspace root over every member with a `stackra.config.ts`. `--check` writes nothing
 *          and fails on a refusal or a stale file, which is the CI gate.
 * Boundary: runs every member even after one fails, so one run reports everything; exits 1 when any member is not
 *           clean.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 10 and 22: `stackra gen --check`); ADR 0295 (decisions 1 and 5); ADR 0261.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

import { CliUsageError } from "#node/errors/cli-usage.error";
import { runGen } from "#node/functions/run-gen.function";
import { workspaceMembers } from "#node/functions/workspace-members.function";
import type { CliCommand } from "#node/types/cli-command.type";

/** The `stackra gen` command definition. */
export const GEN_COMMAND: CliCommand = {
  name: "gen",
  summary: "Generate the manifest, schemas, wiring and entries (--check: fail when stale)",
  usage: "stackra gen [--check] [--backend tsgo|ts6]",
  options: {
    check: { type: "boolean" },
    backend: { type: "string" },
  },
  async run({ cwd, values, io }) {
    const backend = values["backend"];
    if (backend !== undefined && backend !== "tsgo" && backend !== "ts6") {
      throw new CliUsageError(`unknown backend: ${String(backend)} (expected tsgo or ts6)`);
    }
    const options: Parameters<typeof runGen>[1] = {
      check: values["check"] === true,
      base: cwd,
      ...(backend === "tsgo" || backend === "ts6" ? { backend } : {}),
    };
    const roots = existsSync(join(cwd, "pnpm-workspace.yaml"))
      ? workspaceMembers(cwd).filter((root) => existsSync(join(root, "stackra.config.ts")))
      : [cwd];
    let clean = true;
    for (const root of roots) clean = (await runGen(root, options, io)) && clean;
    if (options.check && clean) io.out(`gen --check: ${roots.length} member(s) up to date\n`);
    return clean ? 0 : 1;
  },
};
