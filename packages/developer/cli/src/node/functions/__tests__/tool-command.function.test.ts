/**
 * Stackra file contract:
 * Purpose: unit tests of `toolCommand`: its usage lists the task's options; in a member it runs gen first (not for
 *          lint, not without `stackra.config.ts`) and stops on a refusal; a package with no entry and no tsdown config
 *          has nothing to build; at the workspace root it fans out through
 *          `turbo run <task>` (`test:e2e` and `test:wiring` for those tiers) and refuses `--target`; a Fumadocs docs site's `lint` builds
 *          the site and then fails on a broken link, naming the page (STA-2026); `--tier wiring` starts `encore test`
 *          with the tier in `STACKRA_TEST_TIER`, and the `stackra test` Encore runs reads it there and runs the
 *          generated suite without generating again (STA-2838); the variable is refused outside Encore and in a run that
 *          would start `encore test` a second time, and an `encore test` that exits 0 without the suite having
 *          started fails.
 * Boundary: test only; `runGen` and `runProcess` are replaced by fakes, so nothing is generated or started.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0295 (decision 5); the task vocabulary rule.
 */
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
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
  vi.unstubAllEnvs();
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

/** A service gen wrote the wiring tier for. */
const wiringService = () => {
  writeFileSync(join(root, "stackra.config.ts"), "export default defineService({});\n");
  mkdirSync(join(root, ".stackra"));
  writeFileSync(join(root, ".stackra", "vitest.wiring.config.ts"), "");
};

/** The marker the inner wiring run writes. */
const marker = () => join(root, ".stackra", "encore-wiring.ran");

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

  it("builds a Fumadocs docs site for lint, then names each broken link", async () => {
    mkdirSync(join(root, "src", "config"), { recursive: true });
    writeFileSync(join(root, "src", "config", "docs.config.ts"), "");
    mkdirSync(join(root, "node_modules", "@react-router", "dev"), { recursive: true });
    const site = join(root, ".stackra", "site");
    mkdirSync(join(site, "build", "client"), { recursive: true });
    writeFileSync(join(site, "react-router.config.ts"), "");
    writeFileSync(join(site, "build", "client", "index.html"), '<a href="/gone">Gone</a>');
    const { io, output } = captureIo();
    expect(await toolCommand("lint", "Lint").run({ ...context(), io })).toBe(1);
    expect(gen).toHaveBeenCalled();
    expect(spawn).toHaveBeenCalledTimes(1);
    expect(spawn).toHaveBeenCalledWith(
      { command: "react-router", args: ["build"], cwd: site },
      expect.anything(),
    );
    expect(output()).toContain("/: /gone (no page or file)");
    writeFileSync(join(site, "build", "client", "index.html"), '<a href="/">Home</a>');
    expect(await toolCommand("lint", "Lint").run(context())).toBe(0);
  });

  it("starts encore test for a service's wiring tier, and runs the suite from inside without generating (STA-2838)", async () => {
    wiringService();
    vi.stubEnv("STACKRA_TEST_TIER", "");
    // `encore test` runs the inner `stackra test`, which marks the suite as started.
    spawn.mockImplementation(async () => {
      writeFileSync(marker(), "");
      return 0;
    });
    expect(await toolCommand("test", "Test").run(context({ tier: "wiring" }))).toBe(0);
    expect(gen).toHaveBeenCalledTimes(1);
    expect(spawn).toHaveBeenLastCalledWith(
      { command: "encore", args: ["test"], cwd: root, env: { STACKRA_TEST_TIER: "wiring" } },
      expect.anything(),
    );
    // What `encore test` starts: the member's `test` script, with the tier and Encore's runtime configuration.
    vi.stubEnv("STACKRA_TEST_TIER", "wiring");
    vi.stubEnv("ENCORE_RUNTIME_CONFIG", "from-encore");
    rmSync(marker());
    spawn.mockReset().mockResolvedValue(0);
    expect(await toolCommand("test", "Test").run(context())).toBe(0);
    expect(gen).toHaveBeenCalledTimes(1);
    expect(existsSync(marker())).toBe(true);
    expect(spawn).toHaveBeenLastCalledWith(
      {
        command: "vitest",
        args: ["run", "--config", ".stackra/vitest.wiring.config.ts"],
        cwd: root,
      },
      expect.anything(),
    );
    // The tier on the command line wins over the variable.
    await toolCommand("test", "Test").run(context({ tier: "unit" }));
    expect(spawn).toHaveBeenLastCalledWith(
      { command: "vitest", args: ["run"], cwd: root },
      expect.anything(),
    );
  });

  it("refuses a tier from STACKRA_TEST_TIER outside encore test, so it never starts encore test again (STA-2838)", async () => {
    wiringService();
    vi.stubEnv("STACKRA_TEST_TIER", "wiring");
    for (const name of [
      "ENCORE_RUNTIME_CONFIG",
      "ENCORE_RUNTIME_CONFIG_PATH",
      "ENCORE_APP_META",
      "ENCORE_APP_META_PATH",
    ])
      vi.stubEnv(name, "");
    await expect(toolCommand("test", "Test").run(context())).rejects.toThrow(
      "STACKRA_TEST_TIER=wiring is set, but this is not the test command of `encore test`",
    );
    expect(spawn).not.toHaveBeenCalled();
    expect(gen).not.toHaveBeenCalled();
    // A run that carries the variable never starts a second `encore test`, even when --tier names the tier.
    await expect(toolCommand("test", "Test").run(context({ tier: "wiring" }))).rejects.toThrow(
      "STACKRA_TEST_TIER is already set",
    );
    expect(spawn).not.toHaveBeenCalled();
  });

  it("fails an encore test that exits 0 without the wiring suite having started (STA-2838)", async () => {
    wiringService();
    vi.stubEnv("STACKRA_TEST_TIER", "");
    // A stale marker from an earlier run does not count: the outer run removes it first.
    writeFileSync(marker(), "");
    const { io, output } = captureIo();
    expect(await toolCommand("test", "Test").run({ ...context({ tier: "wiring" }), io })).toBe(1);
    expect(spawn).toHaveBeenCalledWith(
      expect.objectContaining({ command: "encore", args: ["test"] }),
      expect.anything(),
    );
    expect(output()).toContain("encore test exited 0, but the wiring suite never started");
    // Encore's own failure is passed through as it is.
    spawn.mockResolvedValue(3);
    expect(await toolCommand("test", "Test").run(context({ tier: "wiring" }))).toBe(3);
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
    await toolCommand("test", "Test").run(context({ tier: "wiring" }));
    expect(spawn).toHaveBeenLastCalledWith(
      { command: "turbo", args: ["run", "test:wiring"], cwd: root },
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
