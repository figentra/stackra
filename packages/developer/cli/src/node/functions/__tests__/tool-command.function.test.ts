/**
 * Stackra file contract:
 * Purpose: unit tests of `toolCommand`: its usage lists the task's options; in a member it runs gen first (not for
 *          lint, not without `stackra.config.ts`) and stops on a refusal; a package with no entry and no tsdown config
 *          has nothing to build; at the workspace root it fans out through
 *          `turbo run <task>` (`test:e2e` for the e2e tier) and refuses `--target`.
 * Boundary: test only; `runGen` and `runProcess` are replaced by fakes, so nothing is generated or started.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0295 (decision 5); the task vocabulary rule.
 */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { CliUsageError } from "#node/errors/cli-usage.error";
import { captureIo } from "#node/functions/capture-io.function";
import { runGen } from "#node/functions/run-gen.function";
import { runProcess } from "#node/functions/run-process.function";
import { toolCommand } from "#node/functions/tool-command.function";
import type { CliContext } from "#node/types/cli-context.type";

vi.mock("#node/functions/run-gen.function", () => ({ runGen: vi.fn() }));
vi.mock("#node/functions/run-process.function", () => ({ runProcess: vi.fn() }));

const gen = vi.mocked(runGen);
const spawn = vi.mocked(runProcess);

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-cli-"));
  gen.mockReset().mockResolvedValue(true);
  spawn.mockReset().mockResolvedValue(0);
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

const context = (values: CliContext["values"] = {}): CliContext => ({
  cwd: root,
  io: captureIo().io,
  values,
  positionals: [],
  rest: [],
  cli: async () => 0,
});

const pkg = () =>
  writeFileSync(join(root, "stackra.config.ts"), "export default definePackage({});\n");

describe("toolCommand", () => {
  it("names the task and lists its options in the usage", () => {
    const test = toolCommand("test", "Run the tests");
    expect(test.name).toBe("test");
    expect(test.summary).toBe("Run the tests");
    expect(test.usage).toBe("stackra test [--tier <tier>] [--target <target>]");
    expect(toolCommand("lint", "Lint").usage).toBe("stackra lint");
  });

  it("generates, then starts the member's tool", async () => {
    pkg();
    writeFileSync(join(root, "tsdown.config.ts"), "export default {};\n");
    expect(await toolCommand("build", "Build").run(context())).toBe(0);
    expect(gen).toHaveBeenCalledWith(root, { base: root }, expect.anything());
    expect(spawn).toHaveBeenCalledWith(
      { command: "tsdown", args: [], cwd: root },
      expect.anything(),
    );
  });

  it("builds nothing in a package gen wrote no entry for", async () => {
    pkg();
    const { io, output } = captureIo();
    expect(await toolCommand("build", "Build").run({ ...context(), io })).toBe(0);
    expect(gen).toHaveBeenCalled();
    expect(spawn).not.toHaveBeenCalled();
    expect(output()).toContain("nothing to build");
  });

  it("builds nothing in a service: Encore builds it at deploy", async () => {
    writeFileSync(join(root, "stackra.config.ts"), "export default defineService({});\n");
    const { io, output } = captureIo();
    expect(await toolCommand("build", "Build").run({ ...context(), io })).toBe(0);
    expect(spawn).not.toHaveBeenCalled();
    expect(output()).toContain("Encore builds a service at deploy");
  });

  it("stops before the tool when gen refuses", async () => {
    pkg();
    gen.mockResolvedValue(false);
    expect(await toolCommand("typecheck", "Typecheck").run(context())).toBe(1);
    expect(spawn).not.toHaveBeenCalled();
  });

  it("does not generate for lint or a member without stackra.config.ts", async () => {
    pkg();
    await toolCommand("lint", "Lint").run(context());
    rmSync(join(root, "stackra.config.ts"));
    await toolCommand("test", "Test").run(context());
    expect(gen).not.toHaveBeenCalled();
    expect(spawn).toHaveBeenCalledTimes(2);
  });

  it("returns the tool's exit code", async () => {
    spawn.mockResolvedValue(7);
    expect(await toolCommand("lint", "Lint").run(context())).toBe(7);
  });

  it("fans out through turbo at the workspace root", async () => {
    writeFileSync(join(root, "pnpm-workspace.yaml"), "packages:\n  - apps/*\n");
    await toolCommand("build", "Build").run(context());
    expect(spawn).toHaveBeenLastCalledWith(
      { command: "turbo", args: ["run", "build"], cwd: root },
      expect.anything(),
    );
    await toolCommand("test", "Test").run(context({ tier: "e2e" }));
    expect(spawn).toHaveBeenLastCalledWith(
      { command: "turbo", args: ["run", "test:e2e"], cwd: root },
      expect.anything(),
    );
    await expect(toolCommand("dev", "Dev").run(context({ target: "ios" }))).rejects.toThrow(
      CliUsageError,
    );
    await expect(toolCommand("test", "Test").run(context({ tier: "load" }))).rejects.toThrow(
      CliUsageError,
    );
    expect(gen).not.toHaveBeenCalled();
  });
});
