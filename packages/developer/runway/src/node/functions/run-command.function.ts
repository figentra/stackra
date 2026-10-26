/**
 * Stackra file contract:
 * Purpose: `runCommand(command, args, options)`, the real `CommandRunner`: runs a program without a shell and answers
 *          its standard output, or throws with its exit code and standard error.
 * Boundary: no shell, so no argument is ever interpreted; the environment is the caller's (CI's OIDC login, the owner's
 *           session). Output is capped at 16 MB, more than any deploy CLI prints.
 * Runtime: node
 * Governing contract: ADR 0352 (decision 3), ADR 0173 (no secret is an argument).
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import type { CommandRunner } from "#node/types/command-runner.type";

/** The most output one command may print. */
const MAX_BUFFER = 16 * 1024 * 1024;

/**
 * Runs `command` with `args` in `options.cwd`.
 *
 * @throws Error naming the command and its standard error when it exits with an error.
 * @example
 * const head = await runCommand("git", ["rev-parse", "HEAD"], {});
 */
export const runCommand: CommandRunner = async (command, args, options) => {
  try {
    const { stdout } = await promisify(execFile)(command, [...args], {
      cwd: options.cwd,
      maxBuffer: MAX_BUFFER,
    });
    return stdout;
  } catch (error) {
    const stderr = (error as { stderr?: string }).stderr?.trim();
    throw new Error(`${command} ${args[0] ?? ""} failed${stderr ? `: ${stderr}` : ""}`, {
      cause: error,
    });
  }
};
