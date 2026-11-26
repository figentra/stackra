/**
 * Stackra file contract:
 * Purpose: `mcpExecCommand(argv, options?)`, what `stackra mcp exec [--env A,B] -- <argv>` starts: `argv` unchanged
 *          when it names no secret, otherwise one `sops exec-env` per named secret's file
 *          (`<secretsDir>/agents/<NAME>.enc.yaml`), nested, around an `sh -c` line that runs `argv` with every part
 *          single-quoted. Each value reaches the server's environment only, never an argv (STA-1617).
 * Boundary: builds the command; `execWithSecrets` (`./node`) runs it. No value passes through this process: sops
 *           decrypts each value into the child's environment, where the server reads it. A `$NAME` reference in
 *           `argv` is refused, since expanding it would put the value on the server's command line.
 * Runtime: isomorphic
 * Governing contract: ADR 0173; ADR 0257; ADR 0282 (decision 3); ADR 0525 (sops and Cloud KMS); STA-1617.
 */
import { secretNamesOf } from "#core/functions/secret-names-of.function";
import { shellCommandLine } from "#core/functions/shell-command-line.function";
import type { CommandLine } from "#core/types/command-line.type";
import type { McpExecOptions } from "#core/types/mcp-exec-options.type";

/** A secret name: SCREAMING_SNAKE, the same shape as a `$NAME` reference (ADR 0231). */
const SECRET_NAME = /^[A-Z][A-Z0-9_]*$/;

/**
 * The command that launches `argv` with its secrets in its environment.
 *
 * @param argv - the server's program and arguments, as written after `stackra mcp exec --`; no `$NAME` reference.
 * @param options - the secret names (`--env`) and the figentra/secrets clone, required when a name is given.
 * @throws Error when `argv` is empty or holds a `$NAME` reference, when a name is not SCREAMING_SNAKE, or when a name
 *         is given and no clone is.
 * @example
 * mcpExecCommand(["npx", "-y", "@upstash/context7-mcp@4.9.0"], { secrets: ["CONTEXT7_API_KEY"], secretsDir: "/s" });
 * // { command: "sops", args: ["exec-env", "/s/agents/CONTEXT7_API_KEY.enc.yaml", "exec 'npx' '-y' '@upstash/…'"] }
 */
export function mcpExecCommand(argv: readonly string[], options: McpExecOptions = {}): CommandLine {
  const [command, ...args] = argv;
  if (command === undefined) throw new Error("stackra mcp exec: no command given after `--`");
  const referenced = secretNamesOf(argv);
  if (referenced.length > 0)
    throw new Error(
      `stackra mcp exec: ${referenced.join(", ")} in the server's arguments would show in every process listing; ` +
        "name it with --env and let the server read its environment",
    );
  const names = [...new Set(options.secrets ?? [])];
  // Never echo a bad name: it may be a value pasted by mistake.
  if (!names.every((name) => SECRET_NAME.test(name)))
    throw new Error("stackra mcp exec: every --env name is SCREAMING_SNAKE (A_B,C_D)");
  const [first, ...rest] = names;
  if (first === undefined) return { command, args };
  const { secretsDir } = options;
  if (secretsDir === undefined)
    throw new Error("stackra mcp exec: no figentra/secrets clone to read the secrets from");
  const file = (name: string): string => `${secretsDir}/agents/${name}.enc.yaml`;
  // sops exec-env takes one file, so each further secret is one more level; the line holds no `$` expansion, so
  // quoting a level never expands anything.
  let line = `exec ${shellCommandLine(argv)}`;
  for (const name of rest)
    line = `exec ${shellCommandLine(["sops", "exec-env", file(name), line])}`;
  return { command: "sops", args: ["exec-env", file(first), line] };
}
