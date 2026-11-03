/**
 * Stackra file contract:
 * Purpose: `PublishCommand`, `stackra publish [--dry-run] [--registry <origin>]`: checks the member's `stackra.kind`
 *          and its `@<scope>/<kind>-<name>` name (`checkItemPackage`), drawing every problem as a failed checklist row
 *          (exit 1), then runs `pnpm publish` against the registry setting as a task and prints its output when it
 *          ends (the packed file list of a dry run; live under `--verbose`). Every kind (package, skill, agent, mcp,
 *          plugin) publishes the same way, as an npm tarball.
 * Boundary: refuses before packing; the publish token comes from the release workflow's OIDC exchange
 *           (`NODE_AUTH_TOKEN`, stackra-185), never from this command, and pnpm's standard input is closed, so it never
 *           waits on a prompt. The licence, provenance and integrity checks are the registry Worker's.
 * Runtime: node
 * Governing contract: ADR 0453 (decisions 6, 7 and 11); ADR 0282 (decision 3); ADR 0506; STA-1966.
 */
import { Command, Option, type CommandIo } from "@stackra/console";
import { Str } from "@stackra/validation";

import { checkItemPackage } from "#node/functions/check-item-package.function";
import { registryOrigin } from "#node/functions/registry-origin.function";
import { workspaceRoot } from "#node/functions/workspace-root.function";

/** Checks the member, then publishes it to the Stackra registry. */
export class PublishCommand extends Command({
  name: "publish",
  description: "Check the member's stackra.kind and name, then publish it to the Stackra registry",
  bin: true,
}) {
  /** Pack and check without uploading. */
  @Option({ description: "Pack and show what would be published; upload nothing" })
  dryRun = false;

  /** The registry origin. */
  @Option({ description: "The registry origin (default: the workspace's registry setting)" })
  @Str
  registry?: string;

  /** Refuses a faulty member, else publishes it. */
  async handle(io: CommandIo): Promise<number> {
    const problems = checkItemPackage(io.cwd);
    if (problems.length > 0) {
      io.output.checklist({
        title: "stackra publish refused the member",
        rows: problems.map((problem) => ({ name: problem, status: "fail" as const })),
      });
      return 1;
    }
    const registry = registryOrigin(workspaceRoot(io.cwd), this.registry);
    const args = ["publish", "--registry", registry, "--no-git-checks"];
    if (this.dryRun) args.push("--dry-run");
    const { output } = await io.output.task(
      this.dryRun ? "Packing (dry run)" : `Publishing to ${registry}`,
      () => io.process.run("pnpm", args),
    );
    // Under --verbose the output was already echoed as it came.
    if (!io.verbose) for (const line of output.trimEnd().split("\n")) io.output.line(line);
    return 0;
  }
}
