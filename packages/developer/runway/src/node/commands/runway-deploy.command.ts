/**
 * Stackra file contract:
 * Purpose: `RunwayDeployCommand`, `runway deploy <target> [--dry-run]`: from a clean checkout of the head of origin/main,
 *          prints that commit and dispatches each caller workflow of `<target>` (`runRunway`). The run, its GitHub
 *          environment and its record are on GitHub; nothing is built or deployed here.
 * Boundary: runs git and gh only (`runwayIo`); gh uses the person's own login. The guard asks the owner before an
 *           agent runs it (`runway-deploy`, .agents/hooks/_rules.mjs), so the spelling `runway deploy` is kept.
 * Runtime: node
 * Governing contract: ADR 0170; ADR 0352; ADR 0506 (decision 8); STA-268; STA-2100.
 */
import { Argument, Command, Option, type CommandIo } from "@stackra/console";

import { repositoryRoot } from "#node/functions/repository-root.function";
import { runRunway } from "#node/functions/run-runway.function";
import { runwayIo } from "#node/functions/runway-io.function";

/** Dispatches a target's caller workflows for the head of main. */
export class RunwayDeployCommand extends Command({
  name: "deploy",
  description: "Dispatch a target's caller workflows for the head of origin/main",
  examples: ["runway deploy cloudflare-workers --dry-run"],
}) {
  /** The `targets.<name>` to ship. */
  @Argument({ description: "The target, a key of runway.yaml `targets`" })
  target!: string;

  /** Print the gh commands instead of running them. */
  @Option({ description: "Print the gh commands and dispatch nothing" })
  dryRun = false;

  /** The dispatcher; a test replaces it. */
  dispatch: typeof runRunway = runRunway;

  /**
   * Dispatches and resolves with 0.
   *
   * @throws Error when the target has no caller workflows or the checkout is not the head of origin/main.
   */
  handle(io: CommandIo): number {
    this.dispatch(
      ["deploy", this.target, ...(this.dryRun ? ["--dry-run"] : [])],
      runwayIo(repositoryRoot(io.cwd), (line) => io.output.line(line)),
    );
    return 0;
  }
}
