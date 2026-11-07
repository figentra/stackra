/**
 * Stackra file contract:
 * Purpose: `RunwayRollbackCommand`, `runway rollback <sha> [--dry-run]` (ADR 0352): production back to an earlier commit
 *          of main. It refuses the head of origin/main (that is a promote, not a rollback), then runs the promote
 *          path, whose callers record `rollback to <sha>` as the provider's deployment message (runbooks/deploys).
 * Boundary: runs git and gh only (`runwayIo`); the same environment protection and owner gate as a promote apply.
 * Runtime: node
 * Governing contract: ADR 0352 (decision 3: rollback); ADR 0170; ADR 0506 (decision 8); STA-2100.
 */
import { Argument, Command, Option, UsageError, type CommandIo } from "@stackra/console";

import { repositoryRoot } from "#node/functions/repository-root.function";
import { runRunway } from "#node/functions/run-runway.function";
import { runwayIo } from "#node/functions/runway-io.function";

/** Ships an earlier commit of main to production. */
export class RunwayRollbackCommand extends Command({
  name: "rollback",
  bin: true,
  description: "Return production to an earlier commit of origin/main",
  examples: ["runway rollback <sha> --dry-run"],
}) {
  /** The earlier commit. */
  @Argument({ description: "A full commit SHA on origin/main, older than its head" })
  sha!: string;

  /** Print the gh commands instead of running them. */
  @Option({ description: "Print the gh commands and dispatch nothing" })
  dryRun = false;

  /**
   * Rolls back and resolves with 0.
   *
   * @throws UsageError when `sha` is the head of origin/main.
   * @throws Error when the commit is not on origin/main.
   */
  handle(io: CommandIo): number {
    const run = runwayIo(repositoryRoot(io.cwd), (line) => io.output.line(line));
    run.git(["fetch", "--quiet", "origin", "main"]);
    if (run.git(["rev-parse", "origin/main"]) === run.git(["rev-parse", `${this.sha}^{commit}`]))
      throw new UsageError(
        `${this.sha} is the head of origin/main`,
        "A rollback names an earlier commit; ship the head with promote",
      );
    runRunway(["promote", this.sha, ...(this.dryRun ? ["--dry-run"] : [])], run);
    return 0;
  }
}
