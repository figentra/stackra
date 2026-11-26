/**
 * Stackra file contract:
 * Purpose: `runProgram(command, args, options)`, the real `CommandRunner`: runs a program without a shell, writes
 *          `options.input` to its standard input when given, hands each line it prints (standard output and standard
 *          error) to `options.onLine` as it prints it, and answers its standard output, or throws with its exit code
 *          and standard error.
 * Boundary: no shell, so no argument is ever interpreted; the environment is the caller's (CI's OIDC login, the owner's
 *           session). Output is capped at 16 MB per stream, more than any deploy CLI prints. `onLine` gets the raw
 *           line: a caller that prints it masks its own secrets first (the Workers driver does, STA-2860).
 * Runtime: node
 * Governing contract: ADR 0352 (decision 3), ADR 0173 (no secret is an argument); STA-2860.
 */
import { spawn } from "node:child_process";

import type { CommandRunner } from "#node/types/command-runner.type";

/** The most output one command may print on each stream. */
const MAX_BUFFER = 16 * 1024 * 1024;

/** One output stream of the child: everything it printed, and the line still being printed. */
type Stream = { text: string; partial: string };

/**
 * Runs `command` with `args` in `options.cwd`.
 *
 * @throws Error naming the command and its standard error when it exits with an error, cannot start, or prints more
 *         than 16 MB on one stream (it is killed then).
 * @example
 * const head = await runProgram("git", ["rev-parse", "HEAD"], {});
 * await runProgram("pnpm", ["exec", "wrangler", "versions", "upload"], { onLine: (line) => console.error(line) });
 */
export const runProgram: CommandRunner = (command, args, options) =>
  new Promise<string>((resolve, reject) => {
    const fail = (cause: unknown, stderr: string): void => {
      const detail = stderr.trim();
      reject(
        new Error(`${command} ${args[0] ?? ""} failed${detail ? `: ${detail}` : ""}`, { cause }),
      );
    };
    const child = spawn(command, [...args], {
      cwd: options.cwd,
      ...(options.env === undefined ? {} : { env: { ...process.env, ...options.env } }),
      stdio: ["pipe", "pipe", "pipe"],
    });
    const out: Stream = { text: "", partial: "" };
    const err: Stream = { text: "", partial: "" };
    let settled = false;
    const settle = (finish: () => void): void => {
      if (settled) return;
      settled = true;
      finish();
    };
    // Each complete line goes to `onLine` as soon as it is printed; a line split across chunks waits for its end.
    const take = (stream: Stream, chunk: string): void => {
      stream.text += chunk;
      if (stream.text.length > MAX_BUFFER) {
        child.kill();
        settle(() => fail(new RangeError(`printed more than ${MAX_BUFFER} bytes`), err.text));
        return;
      }
      if (options.onLine === undefined) return;
      const lines = (stream.partial + chunk).split("\n");
      stream.partial = lines.pop() ?? "";
      for (const line of lines) options.onLine(line.replace(/\r$/, ""));
    };
    const flush = (stream: Stream): void => {
      if (options.onLine !== undefined && stream.partial !== "")
        options.onLine(stream.partial.replace(/\r$/, ""));
      stream.partial = "";
    };
    child.stdout.setEncoding("utf8").on("data", (chunk: string) => take(out, chunk));
    child.stderr.setEncoding("utf8").on("data", (chunk: string) => take(err, chunk));
    child.on("error", (error) => settle(() => fail(error, err.text)));
    child.on("close", (code, signal) => {
      flush(out);
      flush(err);
      settle(() => {
        if (code === 0) resolve(out.text);
        else
          fail(
            Object.assign(new Error(`exited with ${code ?? signal ?? "nothing"}`), {
              code,
              signal,
              stdout: out.text,
              stderr: err.text,
            }),
            err.text,
          );
      });
    });
    // A write to a program that exited early (EPIPE) is reported by its exit, not here.
    child.stdin.on("error", () => undefined);
    if (options.input !== undefined) child.stdin.end(options.input);
  });
