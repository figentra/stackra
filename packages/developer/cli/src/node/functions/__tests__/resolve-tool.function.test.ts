/**
 * Stackra file contract:
 * Purpose: unit tests of `resolveTool`: the tool per task, layout and target, the generated `.stackra/` config passed
 *          when it exists, Mintlify in `.stackra/site/` for a docs app with `docs.config.ts` (STA-1316), and the
 *          refusals (unknown target or tier as usage errors, no tool as a plain error).
 * Boundary: test only; writes throwaway members in the OS temp directory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0295 (decisions 2 and 5); ADR 0182; ADR 0284.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { CliUsageError } from "#node/errors/cli-usage.error";
import { resolveTool } from "#node/functions/resolve-tool.function";
import type { Member } from "#node/types/member.type";

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-cli-"));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

const member = (layout: Member["layout"], targets: readonly string[] = []): Member => ({
  root,
  layout,
  targets,
});

const generated = (file: string) => {
  mkdirSync(join(root, ".stackra"), { recursive: true });
  writeFileSync(join(root, ".stackra", file), "");
};

describe("resolveTool", () => {
  it("lints and type-checks every code member in place", () => {
    for (const layout of ["app", "package", "service", "worker", "tooling"] as const) {
      expect(resolveTool("lint", member(layout), {})).toEqual({
        command: "oxlint",
        args: ["."],
        cwd: root,
      });
      expect(resolveTool("typecheck", member(layout), {})).toEqual({
        command: "tsc",
        args: ["--noEmit"],
        cwd: root,
      });
    }
  });

  it("passes the generated config when gen wrote one, and none otherwise", () => {
    expect(resolveTool("test", member("package"), {}).args).toEqual(["run"]);
    generated("vitest.config.ts");
    expect(resolveTool("test", member("package"), {}).args).toEqual([
      "run",
      "--config",
      ".stackra/vitest.config.ts",
    ]);
  });

  it("serves, builds and previews a web app with Vite", () => {
    generated("vite.config.ts");
    const web = member("app", ["web"]);
    expect(resolveTool("dev", web, {})).toEqual({
      command: "vite",
      args: ["--config", ".stackra/vite.config.ts"],
      cwd: root,
    });
    expect(resolveTool("build", web, {}).args).toEqual([
      "build",
      "--config",
      ".stackra/vite.config.ts",
    ]);
    expect(resolveTool("start", web, {}).args).toEqual([
      "preview",
      "--config",
      ".stackra/vite.config.ts",
    ]);
  });

  it("serves and exports a mobile app with Expo, per target", () => {
    const mobile = member("app", ["ios", "android"]);
    expect(resolveTool("dev", mobile, {})).toEqual({ command: "expo", args: ["start"], cwd: root });
    expect(resolveTool("dev", mobile, { target: "ios" }).args).toEqual(["start", "--ios"]);
    expect(resolveTool("build", mobile, {}).args).toEqual(["export", "--platform", "all"]);
    expect(resolveTool("build", mobile, { target: "android" }).args).toEqual([
      "export",
      "--platform",
      "android",
    ]);
  });

  it("runs e2e with Playwright for web and desktop and Maestro for native", () => {
    generated("playwright.config.ts");
    const consoleApp = member("app", ["web", "pwa", "desktop"]);
    expect(resolveTool("test", consoleApp, { tier: "e2e" })).toEqual({
      command: "playwright",
      args: ["test", "--config", ".stackra/playwright.config.ts"],
      cwd: root,
    });
    expect(resolveTool("test", consoleApp, { tier: "e2e", target: "desktop" }).command).toBe(
      "playwright",
    );
    expect(resolveTool("test", member("app", ["ios", "android"]), { tier: "e2e" })).toEqual({
      command: "maestro",
      args: ["test", ".stackra/maestro"],
      cwd: root,
    });
  });

  it("builds a package with tsdown and serves and dry-runs a worker with Wrangler", () => {
    expect(resolveTool("build", member("package"), {})).toEqual({
      command: "tsdown",
      args: [],
      cwd: root,
    });
    // Never `--config .stackra/…`: tsdown would take `.stackra/` as cwd; the root shim loads the generated config.
    generated("tsdown.config.ts");
    expect(resolveTool("build", member("package"), {}).args).toEqual([]);
    generated("wrangler.jsonc");
    expect(resolveTool("dev", member("worker"), {}).args).toEqual([
      "dev",
      "--config",
      ".stackra/wrangler.jsonc",
    ]);
    expect(resolveTool("build", member("worker"), {}).args).toEqual([
      "deploy",
      "--dry-run",
      "--outdir",
      "dist",
      "--config",
      ".stackra/wrangler.jsonc",
    ]);
  });

  it("runs a service's generated Encore app, and refuses before gen wrote it", () => {
    expect(() => resolveTool("dev", member("service"), {})).toThrow(/\.stackra\/encore/);
    mkdirSync(join(root, ".stackra", "encore"), { recursive: true });
    expect(resolveTool("dev", member("service"), {})).toEqual({
      command: "encore",
      args: ["run"],
      cwd: join(root, ".stackra", "encore"),
    });
  });

  it("serves a docs app not yet swept with Mintlify from src and refuses its other tasks", () => {
    expect(resolveTool("dev", member("docs"), {})).toEqual({
      command: "mint",
      args: ["dev"],
      cwd: join(root, "src"),
    });
    expect(() => resolveTool("typecheck", member("docs"), {})).toThrow(/Mintlify/);
  });

  it("runs Mintlify in the generated site of a docs app with docs.config.ts", () => {
    mkdirSync(join(root, "src", "config"), { recursive: true });
    writeFileSync(join(root, "src", "config", "docs.config.ts"), "");
    const site = join(root, ".stackra", "site");
    expect(resolveTool("dev", member("docs"), {})).toEqual({
      command: "mint",
      args: ["dev"],
      cwd: site,
    });
    writeFileSync(join(root, "runway.yaml"), "version: 3\nenvironments:\n  dev:\n    port: 3334\n");
    expect(resolveTool("dev", member("docs"), {}).args).toEqual(["dev", "--port", "3334"]);
    expect(resolveTool("build", member("docs"), {})).toEqual({
      command: "mint",
      args: ["validate"],
      cwd: site,
    });
    expect(resolveTool("lint", member("docs"), {})).toEqual({
      command: "mint",
      args: ["broken-links"],
      cwd: site,
    });
  });

  it("refuses an unknown target or tier as a usage error", () => {
    expect(() => resolveTool("dev", member("app", ["web"]), { target: "ios" })).toThrow(
      CliUsageError,
    );
    expect(() => resolveTool("dev", member("package"), { target: "web" })).toThrow(CliUsageError);
    expect(() => resolveTool("test", member("package"), { tier: "load" })).toThrow(CliUsageError);
  });

  it("refuses a task no tool serves with a plain error", () => {
    const refusals: [
      Parameters<typeof resolveTool>[0],
      Member,
      { target?: string; tier?: string },
    ][] = [
      ["dev", member("package"), {}],
      ["build", member("service"), {}],
      ["start", member("app", ["ios"]), {}],
      ["dev", member("app", ["web", "desktop"]), { target: "desktop" }],
      ["test", member("package"), { tier: "e2e" }],
      ["dev", member("app"), {}],
    ];
    for (const [task, subject, options] of refusals) {
      let thrown: unknown;
      try {
        resolveTool(task, subject, options);
      } catch (error) {
        thrown = error;
      }
      expect(thrown).toBeInstanceOf(Error);
      expect(thrown).not.toBeInstanceOf(CliUsageError);
      expect((thrown as Error).message).toContain(`stackra ${task} has no tool`);
    }
  });
});
