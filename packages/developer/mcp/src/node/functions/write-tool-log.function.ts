/**
 * Stackra file contract:
 * Purpose: `writeToolLog(root, tool, result, output)`, the full log of a tool's last run at
 *          `<root>/.stackra/logs/last-<tool>.log`: the command line, the folder it ran in, its whole plain output and
 *          its exit code and time. Each run of the tool replaces it.
 * Boundary: writes that one file and its folder, nothing else; resolves with its path from the root, or undefined when
 *           it cannot be written (a read-only checkout), so a log never fails a tool. The output is already plain and
 *           already redacted by the CLI's runner.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5); STA-2886.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join, posix } from "node:path";

import { TOOL_LOG_DIR } from "#node/constants/tool-log-dir.constant";
import type { ToolRunResult } from "#node/types/tool-run-result.type";

/**
 * Writes the log and resolves with its path from the root.
 *
 * @param root - the repository root.
 * @param tool - the tool's name, the log's (`test` writes `last-test.log`).
 * @param result - the run.
 * @param output - its full plain output.
 * @example
 * await writeToolLog("/repo", "test", result, output); // ".stackra/logs/last-test.log"
 */
export async function writeToolLog(
  root: string,
  tool: string,
  result: Pick<ToolRunResult, "command" | "cwd" | "exitCode" | "durationMs">,
  output: string,
): Promise<string | undefined> {
  const path = posix.join(TOOL_LOG_DIR, `last-${tool.replaceAll(/[^\w-]/g, "_")}.log`);
  const printed = output === "" || output.endsWith("\n") ? output : `${output}\n`;
  const body =
    `$ ${result.command}\n# in ${result.cwd}\n${printed}` +
    `# exit ${result.exitCode} after ${result.durationMs} ms\n`;
  try {
    await mkdir(join(root, TOOL_LOG_DIR), { recursive: true });
    await writeFile(join(root, path), body);
    return path;
  } catch {
    return undefined;
  }
}
