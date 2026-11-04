/**
 * Stackra file contract:
 * Purpose: `TypecheckCommand`, `stackra typecheck`: in a member, gen first (when it has `stackra.config.ts`), then the
 *          type-checker `resolveTool` picks; at the workspace root `turbo run typecheck`. The tool's output streams live
 *          and its exit code is the command's.
 * Boundary: `runToolTask` does the work; the tool starts through `io.process` with the shared streams
 *           (`runInherited`).
 * Runtime: node
 * Governing contract: ADR 0295 (decision 5); the task vocabulary rule; ADR 0506; STA-1966.
 */
import { Command, type CommandIo } from "@stackra/console";

import { cliIoOf } from "#node/functions/cli-io-of.function";
import { runInherited } from "#node/functions/run-inherited.function";
import { runToolTask } from "#node/functions/run-tool-task.function";

/** Type-checks the member, or every member at the root. */
export class TypecheckCommand extends Command({
  name: "typecheck",
  description: "Generate, then type-check the member",
  bin: true,
}) {
  /** Type-checks and returns the tool's exit code. */
  handle(io: CommandIo): Promise<number> {
    return runToolTask("typecheck", { cwd: io.cwd }, cliIoOf(io), (tool) => runInherited(io, tool));
  }
}
