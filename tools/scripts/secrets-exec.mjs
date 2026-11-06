#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: run one command with the `agents` secrets of `figentra/secrets` in its environment (ADR 0525), for
 *   `tools/scripts/mcp.sh`: each `$NAME` or `${NAME}` in the arguments is expanded inside this process, so a token
 *   reaches only the MCP server it is meant for.
 * Boundary: a local clone of figentra/secrets (`$STACKRA_SECRETS_DIR`, default `~/.stackra/secrets`, fast-forwarded
 *   first), `sops decrypt` per file with output captured, and one child process. Only the `agents` scope: CI decrypts
 *   its own scopes with the shared action, never with this.
 * Runtime: node
 * Governing contract: ADR 0525; ADR 0267 (the model never sees a secret).
 * Input: `--scope agents -- <command> [args…]`.
 * Output: the child's own stdio and exit code; on a refusal, one value-free line on stderr and exit 1.
 * Secrets: values go only into the child's environment and expanded arguments; this script prints none.
 */
import { spawn } from "node:child_process";
import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { Refusal, cliRunner, decryptFile, listNames, secretFile } from "./secrets-sops.mjs";

/** Expand `$NAME` and `${NAME}` from `vars`; a name `vars` lacks is left as written. */
export const expandArg = (arg, vars) =>
  arg.replaceAll(/\$\{([A-Z_][A-Z0-9_]*)\}|\$([A-Z_][A-Z0-9_]*)/g, (m, a, b) =>
    Object.hasOwn(vars, a ?? b) ? vars[a ?? b] : m,
  );

/** The `agents` values of a clone, decrypted in memory: `{ NAME: value }`. */
export function agentVars(dir, { run = cliRunner } = {}) {
  const vars = {};
  for (const { scope, name } of listNames(dir))
    if (scope === "agents")
      vars[name] = decryptFile(secretFile(scope, name), name, { cwd: dir, run });
  return vars;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const argv = process.argv.slice(2);
  const sep = argv.indexOf("--");
  try {
    if (argv[0] !== "--scope" || argv[1] !== "agents" || sep !== 2 || argv.length < 4)
      throw new Refusal("usage: secrets-exec.mjs --scope agents -- <command> [args…]");
    const dir = process.env.STACKRA_SECRETS_DIR ?? join(homedir(), ".stackra", "secrets");
    // Best effort: an offline machine runs with the clone it has.
    cliRunner("git", ["-C", dir, "pull", "--ff-only", "--quiet"]);
    const vars = agentVars(dir);
    const [command, ...rest] = argv.slice(3).map((a) => expandArg(a, vars));
    const child = spawn(command, rest, { stdio: "inherit", env: { ...process.env, ...vars } });
    for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"]) process.on(sig, () => child.kill(sig));
    child.on("exit", (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
    child.on("error", () => {
      process.stderr.write("secrets-exec: the command could not be started\n");
      process.exit(127);
    });
  } catch (error) {
    process.stderr.write(
      `secrets-exec: ${error instanceof Refusal ? error.message : "internal error (no detail printed by design)"}\n`,
    );
    process.exit(1);
  }
}
