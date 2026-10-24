/**
 * Stackra file contract:
 * Purpose: unit tests of `runProcess`: piped output reaches the io, the exit code is returned, arguments are not
 *          shell-parsed, a missing program resolves 127, and `node_modules/.bin` above the directory is on `PATH`.
 * Boundary: test only; starts `node` and throwaway scripts in the OS temp directory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0295 (decision 5).
 */
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
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
