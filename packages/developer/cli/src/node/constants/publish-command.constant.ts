/**
 * Stackra file contract:
 * Purpose: `PUBLISH_COMMAND`, `stackra publish [--dry-run] [--registry <origin>]`: checks the member's `stackra.kind`
 *          and its `@<scope>/<kind>-<name>` name (`checkItemPackage`), then runs `pnpm publish` against the registry
 *          setting. Every kind (package, skill, agent, mcp, plugin) publishes the same way, as an npm tarball.
 * Boundary: refuses before packing and prints every problem; the publish token comes from the release workflow's
 *           OIDC exchange (`NODE_AUTH_TOKEN`, stackra-185), never from this command. The licence, provenance and
 *           integrity checks are the registry Worker's.
 * Runtime: node
 * Governing contract: ADR 0453 (decisions 6, 7 and 11); ADR 0282 (decision 3).
 */
import { checkItemPackage } from "#node/functions/check-item-package.function";
import { registryOrigin } from "#node/functions/registry-origin.function";
import { runProcess } from "#node/functions/run-process.function";
import { workspaceRoot } from "#node/functions/workspace-root.function";
import type { CliCommand } from "#node/types/cli-command.type";

/** `stackra publish`: refuses a member `checkItemPackage` faults, then publishes it to the Stackra registry. */
export const PUBLISH_COMMAND: CliCommand = {
  name: "publish",
  summary: "Check the member's stackra.kind and name, then publish it to the Stackra registry",
  usage: "stackra publish [--dry-run] [--registry <origin>]",
  options: { "dry-run": { type: "boolean" }, registry: { type: "string" } },
  async run({ cwd, values, io }) {
    const problems = checkItemPackage(cwd);
    if (problems.length > 0) {
      for (const problem of problems) io.err(`stackra publish: ${problem}\n`);
      return 1;
    }
    const flag = typeof values["registry"] === "string" ? values["registry"] : undefined;
    const args = [
      "publish",
      "--registry",
      registryOrigin(workspaceRoot(cwd), flag),
      "--no-git-checks",
    ];
    if (values["dry-run"] === true) args.push("--dry-run");
    return runProcess({ command: "pnpm", args, cwd }, io);
  },
};
