/**
 * Stackra file contract:
 * Purpose: unit tests of `commandOnPath`: off Windows a command is found only as an executable file in a `PATH`
 *          folder; on Windows the `Path` key is matched without case and `PATHEXT` (or its default) supplies the
 *          extension; a command with a folder in it is checked as that path; no `which` is needed anywhere.
 * Boundary: test only; writes files under a temporary folder and passes its own environment, so the machine's `PATH`
 *           is never read.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-1952 spec FR-014; STA-2859.
 */
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { commandOnPath } from "#node/doctor/functions/command-on-path.function";

let root: string;

/** Writes `name` under `folder` with `mode`, and returns the folder. */
function tool(folder: string, name: string, mode = 0o755): string {
  mkdirSync(join(root, folder), { recursive: true });
  writeFileSync(join(root, folder, name), "#!/bin/sh\nexit 0\n");
  chmodSync(join(root, folder, name), mode);
  return join(root, folder);
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-command-on-path-"));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("commandOnPath", () => {
  it("finds an executable in any PATH folder, skipping empty entries", () => {
    const bin = tool("bin", "mise");
    const env = { PATH: ["", join(root, "missing"), bin].join(":") };
    expect(commandOnPath("mise", env, "linux")).toBe(true);
    expect(commandOnPath("gh", env, "linux")).toBe(false);
    expect(commandOnPath("", env, "darwin")).toBe(false);
  });

  it("refuses a file without the execute bit and a folder of that name off Windows", () => {
    const bin = tool("bin", "gh", 0o644);
    mkdirSync(join(bin, "docker"));
    expect(commandOnPath("gh", { PATH: bin }, "linux")).toBe(false);
    expect(commandOnPath("docker", { PATH: bin }, "linux")).toBe(false);
    // Windows starts only a name with a PATHEXT extension, so the bare `gh` file does not count there either.
    expect(commandOnPath("gh", { PATH: bin, PATHEXT: "" }, "win32")).toBe(false);
  });

  it("reads no PATH when the environment has none", () => {
    expect(commandOnPath("mise", {}, "linux")).toBe(false);
    expect(commandOnPath("mise", {}, "win32")).toBe(false);
  });

  it("checks a command with a folder in it as that path", () => {
    tool("bin", "tool");
    expect(commandOnPath(join(root, "bin", "tool"), { PATH: "" }, "linux")).toBe(true);
    expect(commandOnPath(join(root, "bin", "nope"), { PATH: "" }, "linux")).toBe(false);
  });

  it("on Windows matches Path without case and tries each PATHEXT extension", () => {
    const files = new Set(["C:\\Tools\\gh.EXE", "D:\\Scripts\\pnpm.CMD"]);
    const seen: string[] = [];
    const startable = (file: string, windows: boolean) => {
      seen.push(file);
      return windows && files.has(file);
    };
    const env = { Path: "C:\\Tools;;D:\\Scripts", PATHEXT: ".COM;.EXE;.CMD" };
    expect(commandOnPath("gh", env, "win32", startable)).toBe(true);
    expect(commandOnPath("pnpm", env, "win32", startable)).toBe(true);
    expect(commandOnPath("gh.EXE", env, "win32", startable)).toBe(true);
    expect(commandOnPath("mise", env, "win32", startable)).toBe(false);
    expect(commandOnPath("C:\\Tools\\gh", { PATHEXT: ".EXE" }, "win32", startable)).toBe(true);
    // A bare name is never tried without an extension; a named one is tried as given first.
    expect(seen).not.toContain("C:\\Tools\\mise");
    expect(seen).toContain("C:\\Tools\\gh.EXE");
  });

  it("on Windows falls back to the default PATHEXT when it is unset", () => {
    const files = new Set(["C:\\Tools\\encore.BAT", "C:\\Tools\\pulumi.PS1"]);
    const startable = (file: string) => files.has(file);
    expect(commandOnPath("encore", { PATH: "C:\\Tools" }, "win32", startable)).toBe(true);
    expect(commandOnPath("pulumi", { PATH: "C:\\Tools" }, "win32", startable)).toBe(false);
  });

  it("checks the real file system for a Windows candidate without the execute bit", () => {
    const bin = tool("bin", "gh.EXE", 0o644);
    expect(commandOnPath(join(bin, "gh"), { PATHEXT: ".EXE" }, "win32")).toBe(true);
    expect(commandOnPath(join(bin, "gh.EXE"), { PATH: "" }, "linux")).toBe(false);
  });
});
