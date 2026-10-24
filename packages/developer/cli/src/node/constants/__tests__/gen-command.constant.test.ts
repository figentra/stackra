/**
 * Stackra file contract:
 * Purpose: unit tests of `GEN_COMMAND`: one run in a member, one per `stackra.config.ts` member at the workspace root
 *          (continuing past a failure), `--check` and `--backend` passed on, an unknown backend refused.
 * Boundary: test only; `runGen` is replaced by a fake, so no TypeScript host opens.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 10 and 22).
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "@stackra/testing";

import { GEN_COMMAND } from "#node/constants/gen-command.constant";
import { CliUsageError } from "#node/errors/cli-usage.error";
import { captureIo } from "#node/functions/capture-io.function";
import { runGen } from "#node/functions/run-gen.function";
import type { CliContext } from "#node/types/cli-context.type";

vi.mock("#node/functions/run-gen.function", () => ({ runGen: vi.fn() }));

const gen = vi.mocked(runGen);

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-cli-"));
  gen.mockReset().mockResolvedValue(true);
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

const context = (values: CliContext["values"] = {}, io = captureIo().io): CliContext => ({
  cwd: root,
  io,
  values,
  positionals: [],
  rest: [],
  cli: async () => 0,
});

const member = (path: string, config: boolean) => {
  mkdirSync(join(root, path), { recursive: true });
  writeFileSync(join(root, path, "package.json"), "{}");
  if (config)
    writeFileSync(join(root, path, "stackra.config.ts"), "export default definePackage({});\n");
};

describe("GEN_COMMAND", () => {
  it("is `stackra gen` with --check and --backend", () => {
    expect(GEN_COMMAND.name).toBe("gen");
    expect(Object.keys(GEN_COMMAND.options ?? {})).toEqual(["check", "backend"]);
  });

  it("generates the member in the working directory", async () => {
    expect(await GEN_COMMAND.run(context({ backend: "ts6" }))).toBe(0);
    expect(gen).toHaveBeenCalledWith(
      root,
      { check: false, base: root, backend: "ts6" },
      expect.anything(),
    );
  });

  it("generates every stackra.config.ts member at the workspace root and reports a check", async () => {
    writeFileSync(join(root, "pnpm-workspace.yaml"), "packages:\n  - apps/*\n  - packages/*/*\n");
    member("apps/web", true);
    member("apps/docs", false);
    member("packages/commerce/money", true);
    gen.mockResolvedValueOnce(false);
    const { io, output } = captureIo();
    expect(await GEN_COMMAND.run(context({ check: true }, io))).toBe(1);
    expect(gen.mock.calls.map(([path]) => path)).toEqual([
      join(root, "apps/web"),
      join(root, "packages/commerce/money"),
    ]);
    expect(output()).not.toContain("up to date");

    gen.mockResolvedValue(true);
    const clean = captureIo();
    expect(await GEN_COMMAND.run(context({ check: true }, clean.io))).toBe(0);
    expect(clean.output()).toBe("gen --check: 2 member(s) up to date\n");
  });

  it("refuses an unknown backend", async () => {
    await expect(GEN_COMMAND.run(context({ backend: "babel" }))).rejects.toThrow(CliUsageError);
    expect(gen).not.toHaveBeenCalled();
  });
});
