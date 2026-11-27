/**
 * Stackra file contract:
 * Purpose: unit tests of `toolCommand`: its usage lists the task's options; in a member it runs gen first (not for
 *          lint, not without `stackra.config.ts`) and stops on a refusal; a package with no entry and no tsdown config
 *          has nothing to build; at the workspace root it fans out through
 *          `turbo run <task>` (`test:e2e` for the e2e tier) and refuses `--target`; a Fumadocs docs site's `lint` builds
 *          the site and then fails on a broken link, naming the page (STA-2026); a member's `dev` copies the tool's
 *          output into the repository's dev log, redacted, between a start and an end line (STA-2889); a native
 *          member's `expo start` and a worker's `wrangler dev` run as screen tools; `--no-log` writes no dev log.
 * Boundary: test only; `runGen` and `runProcess` are replaced by fakes, so nothing is generated or started.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0295 (decision 5); the task vocabulary rule.
 */
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { devLogFile, readDevLog } from "@stackra/runway/node";
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
    expect(toolCommand("dev", "Dev").usage).toBe("stackra dev [--target <target>] [--no-log]");
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

  it("copies a member's dev output into the repository's dev log, redacted", async () => {
    writeFileSync(join(root, "pnpm-workspace.yaml"), "packages:\n  - apps/*\n");
    const member = join(root, "apps", "console");
    mkdirSync(member, { recursive: true });
    writeFileSync(join(member, "stackra.config.ts"), "export default defineWorker({});\n");
    spawn.mockImplementation(async (run) => {
      run.tee?.("stdout", "  VITE ready\n");
      run.tee?.("stderr", "4:25AM ERR call failed authorization=Bearer abc.def\n");
      return 1;
    });
    expect(await toolCommand("dev", "Dev").run({ ...context(), cwd: member })).toBe(1);
    expect(spawn).toHaveBeenCalledWith(
      expect.objectContaining({ cwd: member, tee: expect.any(Function) }),
      expect.anything(),
    );
    const log = readDevLog(devLogFile(member));
    expect(log.map(({ level, member: folder }) => [level, folder])).toEqual([
      ["info", "apps/console"],
      ["info", "apps/console"],
      ["error", "apps/console"],
      ["warn", "apps/console"],
    ]);
    expect(log[2]?.message).toBe("4:25AM ERR call failed authorization=[redacted]");
  });

  it("keeps the terminal's stdout for a native member's Expo and a worker's Wrangler", async () => {
    writeFileSync(join(root, "pnpm-workspace.yaml"), "packages:\n  - apps/*\n");
    const mobile = join(root, "apps", "mobile");
    mkdirSync(mobile, { recursive: true });
    writeFileSync(join(mobile, "stackra.config.ts"), "export default defineApp({});\n");
    writeFileSync(join(mobile, "stackra.manifest.json"), JSON.stringify({ targets: ["ios"] }));
    expect(await toolCommand("dev", "Dev").run({ ...context(), cwd: mobile })).toBe(0);
    // `screen` is what makes runProcess leave stdout on the terminal, so Expo still draws its QR code and key menu.
    expect(spawn).toHaveBeenLastCalledWith(
      expect.objectContaining({
        command: "expo",
        screen: true,
        tee: expect.any(Function),
      }),
      expect.anything(),
    );
    const worker = join(root, "apps", "edge");
    mkdirSync(worker, { recursive: true });
    writeFileSync(join(worker, "stackra.config.ts"), "export default defineWorker({});\n");
    expect(await toolCommand("dev", "Dev").run({ ...context(), cwd: worker })).toBe(0);
    expect(spawn).toHaveBeenLastCalledWith(
      expect.objectContaining({ command: "wrangler", screen: true }),
      expect.anything(),
    );
  });

  it("writes no dev log with --no-log and leaves the terminal to the tool", async () => {
    writeFileSync(join(root, "pnpm-workspace.yaml"), "packages:\n  - apps/*\n");
    const member = join(root, "apps", "edge");
    mkdirSync(member, { recursive: true });
    writeFileSync(join(member, "stackra.config.ts"), "export default defineWorker({});\n");
    expect(
      await toolCommand("dev", "Dev").run({ ...context({ "no-log": true }), cwd: member }),
    ).toBe(0);
    const [run] = spawn.mock.calls[0] ?? [];
    expect(run).toMatchObject({ command: "wrangler" });
    expect(run?.tee).toBeUndefined();
    expect(existsSync(devLogFile(member))).toBe(false);
    // At the root, turbo runs each member's own `stackra dev`; the flag belongs to one member.
    await expect(toolCommand("dev", "Dev").run(context({ "no-log": true }))).rejects.toThrow(
      CliUsageError,
    );
  });

  it("copies a docs site's dev output into the dev log too, without the dev secrets", async () => {
    writeFileSync(join(root, "pnpm-workspace.yaml"), "packages:\n  - apps/*\n");
    const site = join(root, "apps", "docs");
    mkdirSync(join(site, "src", "config"), { recursive: true });
    writeFileSync(join(site, "src", "config", "docs.config.ts"), "");
    spawn.mockImplementation(async (run) => {
      run.tee?.("stderr", "Error: page not found: /guides/missing\n");
      return 0;
    });
    expect(await toolCommand("dev", "Dev").run({ ...context(), cwd: site })).toBe(0);
    const [run] = spawn.mock.calls[0] ?? [];
    expect(run).toMatchObject({ command: "mint", tee: expect.any(Function) });
    expect(run?.env).toBeUndefined();
    const log = readDevLog(devLogFile(site));
    expect(log.map(({ level, member, message }) => [level, member, message.slice(0, 22)])).toEqual([
      ["info", "apps/docs", "stackra dev: started m"],
      ["error", "apps/docs", "Error: page not found:"],
      ["info", "apps/docs", "stackra dev: mint dev "],
    ]);
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
