/**
 * Stackra file contract:
 * Purpose: `RunwayPromoteCommand`, `runway promote <sha> [--dry-run]`: needs `<sha>` on origin/main, prints it and the
 *          record message, and dispatches every caller workflow of the production destinations that takes a `sha`
 *          input (`runRunway`). Each run waits on its GitHub environment's protection and, for a private repository,
 *          the O1 owner gate in the caller workflow.
 * Boundary: runs git and gh only (`runwayIo`). The guard asks the owner before an agent runs it (`runway-deploy`,
 *           .agents/hooks/_rules.mjs), so the spelling `runway promote` is kept.
 * Runtime: node
 * Governing contract: ADR 0170; ADR 0352 (decision 3); ADR 0468; ADR 0506 (decision 8); STA-268; STA-2100.
 */
import { Argument, Command, Option, type CommandIo } from "@stackra/console";

import { repositoryRoot } from "#node/functions/repository-root.function";
import { runRunway } from "#node/functions/run-runway.function";
import { runwayIo } from "#node/functions/runway-io.function";

/** Dispatches the production callers for a commit of main. */
export class RunwayPromoteCommand extends Command({
  name: "promote",
  description: "Dispatch the production caller workflows for a commit of origin/main",
  examples: ["runway promote <sha> --dry-run"],
}) {
  /** The commit to ship to production. */
  @Argument({ description: "A full commit SHA on origin/main" })
  sha!: string;

  /** Print the gh commands instead of running them. */
  @Option({ description: "Print the gh commands and dispatch nothing" })
  dryRun = false;

  /**
   * Dispatches and resolves with 0.
   *
   * @throws Error when the commit is not on origin/main.
   */
  handle(io: CommandIo): number {
    runRunway(
      ["promote", this.sha, ...(this.dryRun ? ["--dry-run"] : [])],
      runwayIo(repositoryRoot(io.cwd), (line) => io.output.line(line)),
    );
    return 0;
  }
}
