/**
 * Stackra file contract:
 * Purpose: `TestCommand`, `stackra test [--tier unit|int|e2e] [--target <target>]`: in a member, gen first (when it has
 *          `stackra.config.ts`), then the tier's runner (`resolveTool`); at the workspace root `turbo run test`, or
 *          `turbo run test:e2e` for `--tier e2e`. The runner's output streams live and its exit code is the command's.
 * Boundary: `runToolTask` does the work; the runner starts through `io.process` with the shared streams
 *           (`runInherited`). `--target` at the root and `--tier int` at the root are usage errors (exit 2).
 * Runtime: node
 * Governing contract: ADR 0182 (test tiers); ADR 0295 (decision 5); the task vocabulary rule; ADR 0506; STA-1966.
 */
import { Command, Option, type CommandIo } from "@stackra/console";
import { Str } from "@stackra/validation";

import { cliIoOf } from "#node/functions/cli-io-of.function";
import { runInherited } from "#node/functions/run-inherited.function";
import { runToolTask } from "#node/functions/run-tool-task.function";

/** Runs the member's tests, or every member's at the root. */
export class TestCommand extends Command({
  name: "test",
  description: "Generate, then run the member's tests (--tier unit, int or e2e)",
  bin: true,
}) {
  /** The test tier (ADR 0182). */
  @Option({
    description: "unit (default), int or e2e; at the workspace root unit or e2e",
    choices: ["unit", "int", "e2e"],
  })
  tier?: string;

  /** One of an app's targets. */
  @Option({ description: "One of the app's targets; run it in the app" })
  @Str
  target?: string;

  /** Runs the tests and returns the runner's exit code. */
  handle(io: CommandIo): Promise<number> {
    return runToolTask(
      "test",
      { cwd: io.cwd, tier: this.tier, target: this.target },
      cliIoOf(io),
      (tool) => runInherited(io, tool),
    );
  }
}
