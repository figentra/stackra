/**
 * Stackra file contract:
 * Purpose: `mcpExecCommand(argv, options?)`, what `stackra mcp exec -- <argv>` starts: `argv` unchanged when it names
 *          no secret, otherwise one `sops exec-env` per named secret's file (`<secretsDir>/agents/<NAME>.enc.yaml`),
 *          nested, around an `sh -c` line that expands each `$NAME` inside that one process tree.
 * Boundary: builds the command; `execWithSecrets` (`./node`) runs it. No value passes through this process: sops
 *           decrypts each value into the child's environment and the child's shell expands them.
 * Runtime: isomorphic
 * Governing contract: ADR 0173; ADR 0257; ADR 0282 (decision 3); ADR 0525 (sops and Cloud KMS).
 */
import { secretNamesOf } from "#core/functions/secret-names-of.function";
import { shellCommandLine } from "#core/functions/shell-command-line.function";
import type { CommandLine } from "#core/types/command-line.type";
import type { McpExecOptions } from "#core/types/mcp-exec-options.type";

/**
 * The command that launches `argv` with its secrets.
 *
 * @param argv - the server's program and arguments, as written after `stackra mcp exec --`.
 * @param options - the figentra/secrets clone, required when `argv` names a secret.
 * @throws Error when `argv` is empty, or names a secret and no clone is given.
 * @example
 * mcpExecCommand(["npx", "-y", "@upstash/context7-mcp@4.2.0", "--api-key", "$CONTEXT7_API_KEY"], { secretsDir: "/s" });
 * // { command: "sops", args: ["exec-env", "/s/agents/CONTEXT7_API_KEY.enc.yaml", "exec 'npx' …"] }
 */
export function mcpExecCommand(argv: readonly string[], options: McpExecOptions = {}): CommandLine {
  const [command, ...args] = argv;
  if (command === undefined) throw new Error("stackra mcp exec: no command given after `--`");
  const [first, ...rest] = secretNamesOf(argv);
  if (first === undefined) return { command, args };
  const { secretsDir } = options;
  if (secretsDir === undefined)
    throw new Error("stackra mcp exec: no figentra/secrets clone to read the secrets from");
  const file = (name: string): string => `${secretsDir}/agents/${name}.enc.yaml`;
  // sops exec-env takes one file, so each further secret is one more level; the line holds no `$NAME` of its own (the
  // references are `${NAME:?…}`), so quoting a level never expands a value early.
  let line = `exec ${shellCommandLine(argv)}`;
  for (const name of rest)
    line = `exec ${shellCommandLine(["sops", "exec-env", file(name), line])}`;
  return { command: "sops", args: ["exec-env", file(first), line] };
}
