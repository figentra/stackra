/**
 * Stackra file contract:
 * Purpose: unit tests of `unlistedCommand` and the `stackra` list it drives, on workspaces written to a temp folder:
 *          the app `stackra create` makes (its minimal profile) lists at most 25 commands under the headings in order
 *          and no Repository check; a product with surfaces and a mobile app also lists smoke, preview serve and the
 *          mobile onboarding; a package or a seed-packs folder brings its commands; the core repository lists every
 *          group; `stackra list --all` lists every command anywhere; an unreadable workspace lists as a plain app; and
 *          the workspace is read on the first question, not before.
 * Boundary: test only; runs `runCli` in-process on fixture folders, never a tool.
 * Runtime: node (vitest)
 * Governing contract: STA-2872 spec FR-001, FR-002, FR-003 and SC-001; ADR 0022 (test placement).
 */
// @covers sta-2872:FR-001 sta-2872:FR-002 sta-2872:FR-003 sta-2872:SC-001
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import type { CommandStructure } from "@stackra/console/contracts";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { COMMAND_GROUPS } from "#node/constants/command-groups.constant";
import { COMMANDS } from "#node/constants/commands.constant";
import { captureIo } from "#node/functions/capture-io.function";
import { runCli } from "#node/functions/run-cli.function";
import { unlistedCommand } from "#node/functions/unlisted-command.function";

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-list-"));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

/** Writes `text` (an object is written as JSON) at `path` under the fixture root. */
function write(path: string, text: string | object): void {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), typeof text === "string" ? text : JSON.stringify(text));
}

/** The workspace `stackra create` writes (the template's minimal profile): a web console and one service. */
function minimalApp(): void {
  write("pnpm-workspace.yaml", "packages:\n  - apps/*\n  - packages/*/*\n  - services/*\n");
  write("package.json", { name: "acme-platform", private: true, scripts: { dev: "stackra dev" } });
  write("runway.yaml", "version: 3\nproject: acme-platform\n");
  write("apps/console/package.json", {
    name: "@acme/console",
    dependencies: { "@stackra/app": "catalog:", "@stackra/navigation": "catalog:" },
  });
  write("services/example/package.json", {
    name: "@acme/service-example",
    stackra: { tier: "service" },
    dependencies: {
      "@stackra/actions": "catalog:",
      "@stackra/app": "catalog:",
      "@stackra/database": "catalog:",
      "@stackra/iam": "catalog:",
      "@stackra/queue": "catalog:",
    },
  });
}

/** The commands a `stackra --json` list in `cwd` holds, sorted. */
async function listed(argv: string[] = ["--json"], cwd = root): Promise<string[]> {
  const { io, output } = captureIo();
  expect(await runCli(argv, io, { cwd })).toBe(0);
  return (JSON.parse(output()) as { data: { name: string }[] }).data
    .map((row) => row.name)
    .toSorted();
}

/** A structure as the console reads one, for the predicate alone. */
const structure = (name: string, group?: string): CommandStructure => ({
  name,
  description: name,
  hidden: false,
  aliases: [],
  audit: false,
  bin: false,
  examples: [],
  passthrough: false,
  arguments: [],
  options: [],
  ...(group === undefined ? {} : { group }),
});

describe("the stackra list in an app", () => {
  it("lists at most 25 commands, the ones a new app uses, and no Repository check", async () => {
    minimalApp();
    const names = await listed();
    expect(names.length).toBeLessThanOrEqual(25);
    expect(names).toEqual(
      [
        "add",
        "build",
        "check",
        "console",
        "create",
        "db:diff",
        "db:migrate",
        "db:rollback",
        "db:seed",
        "deploy",
        "dev",
        "dev:secrets:init",
        "doctor",
        "encore:prepare",
        "gen",
        "lint",
        "ls",
        "new",
        "ops:bootstrap-operator",
        "promote",
        "publish",
        "runway",
        "start",
        "test",
        "typecheck",
      ].toSorted(),
    );
  });

  it("draws the headings in the order a developer meets them, and the list --all hint", async () => {
    minimalApp();
    const { io, output } = captureIo();
    expect(await runCli([], io, { cwd: join(root, "services/example") })).toBe(0);
    const headings = output()
      .split("\n")
      .filter((line) => /^ \S/.test(line))
      .map((line) => line.trim());
    expect(headings).toEqual(COMMAND_GROUPS.filter((group) => group !== "Repository"));
    expect(output()).toMatch(/Run "stackra list --all" for every command \(\d+ more\)\./);
  });

  it("lists every command with list --all", async () => {
    minimalApp();
    expect((await listed(["list", "--all", "--json"])).length).toBe(COMMANDS.length);
  });

  it("still runs a Repository check by name", async () => {
    minimalApp();
    const { io, output } = captureIo();
    expect(await runCli(["structure", "--help"], io, { cwd: root })).toBe(0);
    expect(output()).toContain("stackra structure");
  });
});

describe("the stackra list by what the workspace uses", () => {
  it("lists smoke, preview serve and mobile onboarding for a product with surfaces and an app", async () => {
    minimalApp();
    write(
      "runway.yaml",
      "version: 3\nproject: acme-platform\nsurfaces:\n  landing:\n    kind: web\nmobile:\n  app:\n    bundle: com.acme\n",
    );
    expect(await listed()).toEqual(
      expect.arrayContaining(["smoke", "preview:serve", "mobile:onboard"]),
    );
  });

  it("lists the search, settings and audit commands with their packages, and seed-pack with seed packs", async () => {
    minimalApp();
    const before = await listed();
    for (const name of ["search:reindex", "settings:diff", "audit:verify", "seed-pack"])
      expect(before).not.toContain(name);
    write("services/example/package.json", {
      name: "@acme/service-example",
      dependencies: { "@stackra/search": "catalog:", "@stackra/settings": "catalog:" },
      devDependencies: { "@stackra/audit": "catalog:" },
    });
    write("seed-packs/acme/seed-pack.yaml", "version: 1\n");
    expect(await listed()).toEqual(
      expect.arrayContaining([
        "search:reindex",
        "search:status",
        "settings:apply",
        "settings:diff",
        "audit:verify",
        "seed-pack",
      ]),
    );
  });

  it("lists every group in the core repository", async () => {
    minimalApp();
    write("packages/developer/cli/package.json", { name: "@stackra/cli" });
    const names = await listed();
    expect(names).toEqual(expect.arrayContaining(["structure", "cycles", "doc-standard", "smoke"]));
    const { io, output } = captureIo();
    await runCli([], io, { cwd: root });
    expect(output()).toMatch(/ Repository\n/);
  });
});

describe("unlistedCommand", () => {
  it("counts an unreadable workspace as an app with none of the fits", () => {
    write("pnpm-workspace.yaml", "packages:\n  - services/*\n");
    write("package.json", "{ not json");
    const unlisted = unlistedCommand(root);
    expect(unlisted(structure("cycles", "Repository"))).toBe(true);
    expect(unlisted(structure("search:status", "Inspect"))).toBe(true);
    expect(unlisted(structure("gen", "Develop"))).toBe(false);
  });

  it("reads the workspace on the first question, not when it is made", () => {
    const unlisted = unlistedCommand(root);
    minimalApp();
    write("packages/developer/cli/package.json", { name: "@stackra/cli" });
    expect(unlisted(structure("cycles", "Repository"))).toBe(false);
  });
});
