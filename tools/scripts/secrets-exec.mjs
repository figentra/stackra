#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: run one command with the named `agents` secrets of `figentra/secrets` in its environment (ADR 0525). The
 *   root scripts that need a token (`pnpm linear`, `pnpm bot:gh`, `pnpm pr:merge`, …) and `tools/scripts/mcp.sh`
 *   start their command through this, each naming only the secrets that command reads.
 * Boundary: a local clone of figentra/secrets (`$STACKRA_SECRETS_DIR`, default `~/.stackra/secrets`, fast-forwarded
 *   first), `sops decrypt` of each named `agents/<NAME>.enc.yaml` with output captured, and one child process. Only
 *   the `agents` scope, which only the owner's Google login decrypts: CI decrypts its own scopes with the shared
 *   action, never with this.
 * Runtime: node
 * Governing contract: ADR 0525; ADR 0267 (the model never sees a secret); ADR 0257.
 * Input: `--names A,B[,…] [--expand-args] -- <command> [args…]`. A named secret with no file is skipped, so a
 *   command that takes one of several credentials (Linear's app token or personal key) gets whichever exists.
 *   `--expand-args` (mcp.sh only) replaces `$NAME` and `${NAME}` of a named secret in the arguments, for an MCP
 *   server that takes its token as a flag (a referenced name with no file is then a refusal); without it the
 *   arguments pass through untouched, so a `$NAME` an agent types never becomes a value.
 * Output: the child's own stdio and exit code; on a refusal, one value-free line on stderr and exit 1.
 * Secrets: values exist only in this process's memory and the child's environment (and, with `--expand-args`, the
 *   child's argv). This script never prints, logs or writes one, and puts none on any other argv.
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { NAME_RX, Refusal, cliRunner, decryptFile, secretFile } from "./secrets-sops.mjs";

export const USAGE = "usage: secrets-exec.mjs --names A,B[,…] [--expand-args] -- <command> [args…]";

/** Expand `$NAME` and `${NAME}` from `vars`; a name `vars` lacks is left as written. */
export const expandArg = (arg, vars) =>
  arg.replaceAll(/\$\{([A-Z_][A-Z0-9_]*)\}|\$([A-Z_][A-Z0-9_]*)/g, (m, a, b) =>
    Object.hasOwn(vars, a ?? b) ? vars[a ?? b] : m,
  );

/** `{ names, expand, command }` from argv, or a Refusal. Never echoes an argument. */
export function parseExecArgs(argv) {
  const sep = argv.indexOf("--");
  const opts = sep === -1 ? argv : argv.slice(0, sep);
  const command = sep === -1 ? [] : argv.slice(sep + 1);
  let names = [];
  let expand = false;
  for (let i = 0; i < opts.length; i++)
    if (opts[i] === "--names")
      names = String(opts[++i] ?? "")
        .split(",")
        .filter(Boolean);
    else if (opts[i] === "--expand-args") expand = true;
    else throw new Refusal(USAGE);
  if (!names.length || !command.length || !names.every((n) => NAME_RX.test(n)))
    throw new Refusal(USAGE);
  return { names: [...new Set(names)], expand, command };
}

/** The named `agents` values of a clone, decrypted in memory: `{ NAME: value }`. A name with no file is skipped. */
export function agentVars(dir, names, { run = cliRunner } = {}) {
  const vars = {};
  for (const name of names) {
    const file = secretFile("agents", name);
    if (existsSync(join(dir, file))) vars[name] = decryptFile(file, name, { cwd: dir, run });
  }
  return vars;
}

/**
 * Decrypt the named secrets and start the command with them. Returns the child, or null after writing a refusal.
 * Tests inject `run` (the sops and git runner), `spawnChild`, `env` and `write`.
 */
export function main(
  argv,
  {
    env = process.env,
    home = homedir(),
    run = cliRunner,
    spawnChild = spawn,
    write = (s) => process.stderr.write(s),
  } = {},
) {
  try {
    const { names, expand, command } = parseExecArgs(argv);
    const dir = env.STACKRA_SECRETS_DIR ?? join(home, ".stackra", "secrets");
    if (!existsSync(join(dir, "agents")))
      throw new Refusal(
        `no figentra/secrets clone with an agents scope at ${dir} (clone it there, or set STACKRA_SECRETS_DIR)`,
      );
    // Best effort: an offline machine runs with the clone it has.
    run("git", ["-C", dir, "pull", "--ff-only", "--quiet"]);
    const vars = agentVars(dir, names, { run });
    if (expand) {
      // A server that takes its token as a flag would start with the literal `$NAME`; fail here, by name.
      const absent = names.filter(
        (n) => !Object.hasOwn(vars, n) && command.some((a) => expandArg(a, { [n]: "" }) !== a),
      );
      if (absent.length)
        throw new Refusal(`not in the agents scope of ${dir}: ${absent.join(", ")}`);
    }
    const [cmd, ...args] = expand ? command.map((a) => expandArg(a, vars)) : command;
    return spawnChild(cmd, args, { stdio: "inherit", env: { ...env, ...vars } });
  } catch (error) {
    write(
      `secrets-exec: ${error instanceof Refusal ? error.message : "internal error (no detail printed by design)"}\n`,
    );
    return null;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const child = main(process.argv.slice(2));
  if (!child) process.exit(1);
  for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"]) process.on(sig, () => child.kill(sig));
  child.on("exit", (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
  child.on("error", () => {
    process.stderr.write("secrets-exec: the command could not be started\n");
    process.exit(127);
  });
}
