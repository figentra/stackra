/**
 * Stackra file contract:
 * Purpose: `LintCommand`, `stackra lint`: oxlint over the member (no gen first), or a docs app's link and
 *          accessibility checks after gen (`runToolTask`); at the workspace root `turbo run lint`. The tool's output
 *          streams live and its exit code is the command's; a broken docs link exits 1 naming its page.
 * Boundary: `runToolTask` does the work; the tool starts through `io.process` with the shared streams
 *           (`runInherited`).
 * Runtime: node
 * Governing contract: ADR 0295 (decision 5); ADR 0002 (2026-10-27 amendment); the task vocabulary rule; ADR 0506;
 *                     STA-1966; STA-2026.
 */
import { Command, type CommandIo } from "@stackra/console";

import { cliIoOf } from "#node/functions/cli-io-of.function";
import { runInherited } from "#node/functions/run-inherited.function";
import { runToolTask } from "#node/functions/run-tool-task.function";

/** Lints the member, or every member at the root. */
export class LintCommand extends Command({
  name: "lint",
  description: "Lint the member with oxlint",
  bin: true,
}) {
  /** Lints and returns the tool's exit code. */
  handle(io: CommandIo): Promise<number> {
    return runToolTask("lint", { cwd: io.cwd }, cliIoOf(io), (tool) => runInherited(io, tool));
  }
}
