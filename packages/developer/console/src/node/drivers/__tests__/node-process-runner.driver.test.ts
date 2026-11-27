/**
 * Stackra file contract:
 * Purpose: proves the node process runner captures standard output and error in order, runs in the given working
 *          directory with the extra environment, streams each chunk to the listener, sends both outputs of an
 *          `inherit: "stderr"` child to standard error uncaptured (interactive or not), resolves a command that
 *          cannot start as exit 127 with the reason, and starts every child through cross-spawn, so on Windows a
 *          `.cmd` shim starts by its bare name with its arguments intact (the Windows smoke job runs that case).
 * Boundary: unit test that spawns `node` itself.
 * Runtime: node
 * Governing contract: STA-1966 spec FR-007; ADR 0506 (amendment 2026-11-03); ADR 0022 (test placement); STA-2899.
 */
// @covers sta-1966:FR-007
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import crossSpawn from "cross-spawn";

import { NodeProcessRunnerDriver } from "#node/drivers/node-process-runner.driver";

// The real cross-spawn behind a spy, so a test can see that every child goes through it.
vi.mock("cross-spawn", async (importOriginal) => {
  const actual = (await importOriginal<{ default: typeof crossSpawn }>()).default;
  return { default: vi.fn(actual) };
});

const runner = new NodeProcessRunnerDriver();

describe("NodeProcessRunnerDriver", () => {
  it("captures both streams, in the working directory, with the extra environment", async () => {
    const directory = realpathSync(tmpdir());
    const chunks: string[] = [];
    const result = await runner.run(
      process.execPath,
      [
        "-e",
        "console.log(process.cwd()); console.error(process.env.STACKRA_PROBE); process.exit(3)",
      ],
      { cwd: directory, env: { STACKRA_PROBE: "probe" }, onOutput: (chunk) => chunks.push(chunk) },
    );
    expect(result.code).toBe(3);
    expect(result.output).toContain(directory);
    expect(result.output).toContain("probe");
    expect(chunks.join("")).toBe(result.output);
  });

  it.each([[{}], [{ interactive: true }]])(
    'sends both outputs of an inherit: "stderr" child to standard error, capturing nothing, given %j',
    async (options) => {
      // The child exits 0 only when its stdout is the same file as its stderr.
      const sameFile =
        "const fs = require('node:fs'); const [o, e] = [fs.fstatSync(1), fs.fstatSync(2)];" +
        "process.exit(o.dev === e.dev && o.ino === e.ino ? 0 : 1)";
      const chunks: string[] = [];
      const result = await runner.run(process.execPath, ["-e", sameFile], {
        ...options,
        cwd: tmpdir(),
        inherit: "stderr",
        onOutput: (chunk) => chunks.push(chunk),
      });
      expect(result).toEqual({ code: 0, output: "" });
      expect(chunks).toEqual([]);
    },
  );

  it("starts the child through cross-spawn", async () => {
    vi.mocked(crossSpawn).mockClear();
    await runner.run(process.execPath, ["-e", ""], { cwd: tmpdir() });
    expect(crossSpawn).toHaveBeenCalledTimes(1);
    expect(vi.mocked(crossSpawn).mock.calls[0]?.slice(0, 2)).toEqual([
      process.execPath,
      ["-e", ""],
    ]);
  });

  it.runIf(process.platform === "win32")(
    "starts a .cmd shim by its bare name, arguments intact",
    async () => {
      const directory = mkdtempSync(join(tmpdir(), "stackra-runner-"));
      try {
        const bin = join(directory, "node_modules", ".bin");
        mkdirSync(bin, { recursive: true });
        writeFileSync(
          join(bin, "echo-args.js"),
          "process.stdout.write(JSON.stringify(process.argv.slice(2)))",
        );
        // The shape of the shim pnpm and npm write: node on the script beside it, every argument passed on.
        writeFileSync(join(bin, "stackra-echo.cmd"), '@node "%~dp0\\echo-args.js" %*\r\n');
        const args = ["two words", "a&b|c", 'say "hi"'];
        const result = await runner.run("stackra-echo", args, {
          cwd: directory,
          env: { PATH: `${bin};${process.env["PATH"] ?? ""}` },
        });
        expect(result.code).toBe(0);
        expect(JSON.parse(result.output)).toEqual(args);
      } finally {
        rmSync(directory, { recursive: true, force: true });
      }
    },
  );

  it("resolves a command that cannot start as exit 127 with the reason", async () => {
    const result = await runner.run("stackra-no-such-binary", [], { cwd: tmpdir() });
    expect(result.code).toBe(127);
    expect(result.output).toContain("stackra-no-such-binary");
  });
});
