/**
 * Stackra file contract:
 * Purpose: `mcpExecCommand(argv, options?)`, what `stackra mcp exec -- <argv>` starts: `argv` unchanged when it names
 *          no secret, otherwise `infisical run` for the configured environment and folder around an `sh -c` line that
 *          expands each `$NAME` inside that one process tree.
 * Boundary: builds the command; `execWithSecrets` (`./node`) runs it. No value passes through this process: Infisical
 *           hands the values to the child's environment and the child's shell expands them.
 * Runtime: isomorphic
 * Governing contract: ADR 0173; ADR 0257 (defaults `dev` and `/agents`); ADR 0282 (decision 3).
 */
import { secretNamesOf } from "#core/functions/secret-names-of.function";
import { shellCommandLine } from "#core/functions/shell-command-line.function";
import type { CommandLine } from "#core/types/command-line.type";
import type { McpExecOptions } from "#core/types/mcp-exec-options.type";

/**
 * The command that launches `argv` with its secrets.
 *
 * @param argv - the server's program and arguments, as written after `stackra mcp exec --`.
 * @param options - the Infisical environment and folder.
 * @throws Error when `argv` is empty.
 * @example
 * mcpExecCommand(["npx", "-y", "@upstash/context7-mcp@4.2.0", "--api-key", "$CONTEXT7_API_KEY"]);
 * // { command: "infisical", args: ["run", "--env=dev", "--path=/agents", "--silent", "--", "sh", "-c", "…"] }
 */
export function mcpExecCommand(argv: readonly string[], options: McpExecOptions = {}): CommandLine {
  const [command, ...args] = argv;
  if (command === undefined) throw new Error("stackra mcp exec: no command given after `--`");
  if (secretNamesOf(argv).length === 0) return { command, args };
  return {
    command: "infisical",
    args: [
      "run",
      `--env=${options.environment ?? "dev"}`,
      `--path=${options.path ?? "/agents"}`,
      "--silent",
      "--",
      "sh",
      "-c",
      `exec ${shellCommandLine(argv)}`,
    ],
  };
}
