/**
 * Stackra file contract:
 * Purpose: `StartCommand`, `stackra start`: in an app, gen first (when it has `stackra.config.ts`), then the preview of
 *          its web build `resolveTool` picks; at the workspace root `turbo run start`. The tool's output streams live
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

/** Previews an app's web build. */
export class StartCommand extends Command({
  name: "start",
  description: "Generate, then preview an app's web build",
  bin: true,
}) {
  /** Starts the preview and returns its exit code. */
  handle(io: CommandIo): Promise<number> {
    return runToolTask("start", { cwd: io.cwd }, cliIoOf(io), (tool) => runInherited(io, tool));
  }
}
