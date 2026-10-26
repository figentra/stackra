/**
 * Stackra file contract:
 * Purpose: unit tests of `GEN_COMMAND`: one run in a member, one per `stackra.config.ts` member at the workspace root
 *          (continuing past a failure), `--check` and `--backend` passed on, an unknown backend refused; the manifest
 *          pass before the full pass, `--manifests` alone, and the rounds (the refused members and the client
 *          consumers, until a round writes nothing) that print only the last round's refusals.
 * Boundary: test only; `runGen` is replaced by a fake, so no TypeScript host opens.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 10 and 22).
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

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
  it("is `stackra gen` with --check, --backend and --manifests", () => {
    expect(GEN_COMMAND.name).toBe("gen");
    expect(Object.keys(GEN_COMMAND.options ?? {})).toEqual(["check", "backend", "manifests"]);
  });

  it("generates the member in the working directory: its manifest, then everything", async () => {
    expect(await GEN_COMMAND.run(context({ backend: "ts6" }))).toBe(0);
    expect(gen.mock.calls.map(([path, options]) => [path, options])).toEqual([
      [root, { check: false, base: root, backend: "ts6", pass: "manifests" }],
      [root, { check: false, base: root, backend: "ts6" }],
    ]);
  });

  it("runs the manifest pass alone with --manifests, and refuses it with --check", async () => {
    expect(await GEN_COMMAND.run(context({ manifests: true }))).toBe(0);
    expect(gen.mock.calls.map(([, options]) => options.pass)).toEqual(["manifests"]);
    await expect(GEN_COMMAND.run(context({ manifests: true, check: true }))).rejects.toThrow(
      CliUsageError,
    );
  });

  it("reruns the refused members and the client consumers until a round writes nothing", async () => {
    writeFileSync(join(root, "pnpm-workspace.yaml"), "packages:\n  - services/*\n");
    member("services/catalogue", true);
    member("services/channels", true);
    member("services/stock", true);
    mkdirSync(join(root, "services/channels/.stackra/gen/clients"), { recursive: true });
    const [catalogue, channels, stock] = ["catalogue", "channels", "stock"].map((name) =>
      join(root, "services", name),
    );
    // Round 1: stock is refused but writes its manifest; round 2 writes nothing, so the run stops there.
    let stockRuns = 0;
    gen.mockImplementation(async (path, options, io) => {
      if (options.pass === "manifests" || path !== stock) return true;
      stockRuns += 1;
      if (stockRuns === 1) io.out("wrote services/stock/stackra.manifest.json\n");
      io.err(`stock refusal ${stockRuns}\n`);
      return false;
    });
    const { io, output } = captureIo();
    expect(await GEN_COMMAND.run(context({}, io))).toBe(1);
    expect(gen.mock.calls.map(([path, options]) => [path, options.pass])).toEqual([
      [catalogue, "manifests"],
      [channels, "manifests"],
      [stock, "manifests"],
      [catalogue, undefined],
      [channels, undefined],
      [stock, undefined],
      [channels, undefined],
      [stock, undefined],
    ]);
    expect(output()).toBe("wrote services/stock/stackra.manifest.json\nstock refusal 2\n");
  });

  it("gives a refused member that still wrote files another round", async () => {
    writeFileSync(join(root, "pnpm-workspace.yaml"), "packages:\n  - services/*\n");
    member("services/sales", true);
    const sales = join(root, "services/sales");
    // Round 1: refused but its manifest is written; round 2: clean.
    let runs = 0;
    gen.mockImplementation(async (_path, options, io) => {
      if (options.pass === "manifests") return true;
      runs += 1;
      if (runs > 1) return true;
      io.out("wrote services/sales/stackra.manifest.json\n");
      io.err("sales refusal\n");
      return false;
    });
    const { io, output } = captureIo();
    expect(await GEN_COMMAND.run(context({}, io))).toBe(0);
    expect(gen.mock.calls.filter(([path]) => path === sales)).toHaveLength(3);
    expect(output()).toBe("wrote services/sales/stackra.manifest.json\n");
  });

  it("refuses an unknown backend", async () => {
    await expect(GEN_COMMAND.run(context({ backend: "babel" }))).rejects.toThrow(CliUsageError);
    expect(gen).not.toHaveBeenCalled();
  });
});
