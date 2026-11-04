/**
 * Stackra file contract:
 * Purpose: unit tests of `runProgram`: answers a program's standard output, runs no shell (an argument is passed as
 *          written), and throws naming the program and its standard error when it fails.
 * Boundary: test only; runs the current Node binary, nothing else.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0352 (decision 3).
 */
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
});
