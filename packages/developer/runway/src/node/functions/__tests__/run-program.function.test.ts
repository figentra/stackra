/**
 * Stackra file contract:
 * Purpose: unit tests of `runProgram`: answers a program's standard output, runs no shell (an argument is passed as
 *          written), throws naming the program and its standard error when it fails or cannot start, and hands each
 *          line it prints (standard output and standard error) to `onLine` while it is still running (STA-2860).
 * Boundary: test only; runs the current Node binary, nothing else.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0352 (decision 3); STA-2860.
 */
import { existsSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "@stackra/testing";

import { runProgram } from "#node/functions/run-program.function";

describe("runProgram", () => {
  it("answers standard output and passes arguments as written", async () => {
    const out = await runProgram(
      process.execPath,
      ["-e", "console.log(process.argv[1])", "$HOME; true"],
      {},
    );
    expect(out).toBe("$HOME; true\n");
  });

  it("writes the input to standard input", async () => {
    const out = await runProgram(process.execPath, ["-e", "process.stdin.pipe(process.stdout)"], {
      input: '{"A":"b"}',
    });
    expect(out).toBe('{"A":"b"}');
  });

  it("throws with the standard error", async () => {
    await expect(
      runProgram(process.execPath, ["-e", "console.error('boom'); process.exit(2)"], {}),
    ).rejects.toThrow(/failed: boom/);
  });

  it("throws naming the program when it cannot start", async () => {
    await expect(
      runProgram(join(tmpdir(), "runway-no-such-program"), ["--version"], {}),
    ).rejects.toThrow(/runway-no-such-program --version failed/);
  });

  it("adds variables to the inherited environment", async () => {
    const out = await runProgram(
      process.execPath,
      ["-e", "process.stdout.write(process.env.RUNWAY_TEST_VALUE ?? 'unset')"],
      { env: { RUNWAY_TEST_VALUE: "set" } },
    );
    expect(out).toBe("set");
  });

  it("streams each line while the program still runs, and still answers the whole output", async () => {
    // The program prints a line, then waits (up to 10 s) for a file that only the caller's `onLine` creates: a runner
    // that hands lines over only at the end never creates it, and the program fails.
    const folder = mkdtempSync(join(tmpdir(), "runway-stream-"));
    const go = join(folder, "go");
    const script = [
      "const fs = require('node:fs');",
      "process.stdout.write('waiting\\n');",
      "const deadline = Date.now() + 10000;",
      "const tick = () => {",
      "  if (fs.existsSync(process.argv[1])) {",
      "    process.stderr.write('warn: half');",
      "    setTimeout(() => process.stderr.write(' a line\\r\\n'), 50);",
      "    setTimeout(() => process.stdout.write('done\\nno newline'), 150);",
      "  } else if (Date.now() > deadline) { process.stderr.write('never streamed'); process.exit(3); }",
      "  else setTimeout(tick, 20);",
      "};",
      "tick();",
    ].join("\n");
    const lines: string[] = [];
    const out = await runProgram(process.execPath, ["-e", script, go], {
      onLine: (line) => {
        lines.push(line);
        if (line === "waiting") writeFileSync(go, "");
      },
    });
    expect(existsSync(go)).toBe(true);
    // A line split across writes arrives whole, without its CR; the last line without a newline arrives at the end.
    expect(lines).toEqual(["waiting", "warn: half a line", "done", "no newline"]);
    expect(out).toBe("waiting\ndone\nno newline");
  }, 15_000);

  it("streams nothing without onLine", async () => {
    const out = await runProgram(
      process.execPath,
      ["-e", "console.log('a'); console.error('b')"],
      {},
    );
    expect(out).toBe("a\n");
  });
});
