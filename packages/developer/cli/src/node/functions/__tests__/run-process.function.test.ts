/**
 * Stackra file contract:
 * Purpose: unit tests of `runProcess`: piped output reaches the io, the exit code is returned, arguments are not
 *          shell-parsed, a missing program resolves 127, `node_modules/.bin` above the directory is on `PATH`, and a
 *          process past its `timeoutMs` is stopped and resolves 124 while one that ends first keeps its code; a tee
 *          gets every chunk by stream while the io still gets the output, even when the io inherits the terminal; a
 *          teed `screen` run on the terminal keeps the terminal's stdout (the same open file as this process's) and
 *          tees its stderr only.
 * Boundary: test only; starts `node` and throwaway scripts in the OS temp directory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0295 (decision 5).
 */
import { chmodSync, fstatSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { captureIo } from "#node/functions/capture-io.function";
import { runProcess } from "#node/functions/run-process.function";

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-cli-"));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("runProcess", () => {
  it("pipes output into the io and returns the exit code", async () => {
    const { io, output } = captureIo();
    const code = await runProcess(
      {
        command: process.execPath,
        args: ["-e", "process.stdout.write('out;'); process.stderr.write('err;'); process.exit(3)"],
        cwd: root,
      },
      io,
    );
    expect(code).toBe(3);
    expect(output()).toContain("out;");
    expect(output()).toContain("err;");
  });

  it("hands every chunk to the tee by stream and still to the io", async () => {
    const { io, output } = captureIo();
    const teed: [string, string][] = [];
    const code = await runProcess(
      {
        command: process.execPath,
        args: [
          "-e",
          "process.stdout.write('ready\\n'); process.stderr.write('TypeError: boom\\n')",
        ],
        cwd: root,
        tee: (stream, text) => teed.push([stream, text]),
      },
      // An io that inherits the terminal: the tee still sees the output, so it is piped, and the io still prints it.
      { ...io, inherit: true },
    );
    expect(code).toBe(0);
    expect(
      teed
        .filter(([stream]) => stream === "stdout")
        .map(([, text]) => text)
        .join(""),
    ).toBe("ready\n");
    expect(
      teed
        .filter(([stream]) => stream === "stderr")
        .map(([, text]) => text)
        .join(""),
    ).toBe("TypeError: boom\n");
    expect(output()).toContain("ready");
    expect(output()).toContain("TypeError: boom");
  });

  it("keeps a teed screen tool's stdout on the terminal and tees its stderr only", async () => {
    // The child names the file behind its stdout on stderr; inherited, it is the very file this process writes to.
    const probe =
      "const s = require('node:fs').fstatSync(1); process.stderr.write(`${s.dev}:${s.ino}\\n`)";
    const own = fstatSync(1);
    const stdoutOf = async (screen: boolean) => {
      const { io, output } = captureIo();
      const teed: [string, string][] = [];
      const code = await runProcess(
        {
          command: process.execPath,
          args: ["-e", probe],
          cwd: root,
          tee: (stream, text) => teed.push([stream, text]),
          screen,
        },
        { ...io, inherit: true },
      );
      expect(code).toBe(0);
      expect(teed.map(([stream]) => stream)).toEqual(["stderr"]);
      return output().trim();
    };
    // Expo and Wrangler draw their interactive screen only when this is a terminal, so it must not become a pipe.
    expect(await stdoutOf(true)).toBe(`${own.dev}:${own.ino}`);
    expect(await stdoutOf(false)).not.toBe(`${own.dev}:${own.ino}`);
  });

  it("passes arguments without a shell", async () => {
    const { io, output } = captureIo();
    await runProcess(
      {
        command: process.execPath,
        args: ["-e", "process.stdout.write(process.argv[1])", "$HOME; echo hi"],
        cwd: root,
      },
      io,
    );
    expect(output()).toBe("$HOME; echo hi");
  });

  it.skipIf(process.platform === "win32")(
    "stops a process still running at its deadline and resolves 124",
    async () => {
      const { io, output } = captureIo();
      const started = Date.now();
      expect(
        await runProcess({ command: "sleep", args: ["10"], cwd: root, timeoutMs: 200 }, io),
      ).toBe(124);
      expect(Date.now() - started).toBeLessThan(5000);
      expect(output()).toContain("sleep gave no answer in 200 ms");
    },
  );

  it.skipIf(process.platform === "win32")(
    "keeps the exit code of a process that ends before its deadline",
    async () => {
      const { io } = captureIo();
      expect(await runProcess({ command: "true", args: [], cwd: root, timeoutMs: 5000 }, io)).toBe(
        0,
      );
    },
  );

  it("resolves 127 when the program cannot start", async () => {
    const { io, output } = captureIo();
    expect(await runProcess({ command: "stackra-no-such-tool", args: [], cwd: root }, io)).toBe(
      127,
    );
    expect(output()).toContain("cannot start stackra-no-such-tool");
  });

  it.skipIf(process.platform === "win32")(
    "finds a tool in a node_modules/.bin above the directory",
    async () => {
      const bin = join(root, "node_modules", ".bin");
      mkdirSync(bin, { recursive: true });
      writeFileSync(join(bin, "stackra-fixture-tool"), "#!/bin/sh\necho from-bin\n");
      chmodSync(join(bin, "stackra-fixture-tool"), 0o755);
      const member = join(root, "apps", "web");
      mkdirSync(member, { recursive: true });
      const { io, output } = captureIo();
      expect(await runProcess({ command: "stackra-fixture-tool", args: [], cwd: member }, io)).toBe(
        0,
      );
      expect(output()).toBe("from-bin\n");
    },
  );
});
