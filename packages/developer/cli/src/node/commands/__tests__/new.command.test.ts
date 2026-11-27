/**
 * Stackra file contract:
 * Purpose: unit tests of `NewCommand`: in a terminal it asks what the line left out (the kind, the name, a service's
 *          area, a package's category from the folders that exist, a template's description and summary) and never
 *          asks what was given; without a terminal it asks nothing and exits 2 naming what to pass (the body's own
 *          refusals, and `--description` / `--summary` for a template kind, which used to exit 1); `newKinds` offers
 *          every kind the body's usage names.
 * Boundary: test only; writes throwaway workspaces in the OS temp directory, and the template renderer (`scaffold`) is
 *           stubbed, so no template is read.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0506; STA-1730 spec FR-023; STA-2883 spec FR-003 and FR-004.
 */
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { runCommandForTest } from "@stackra/console/testing";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { NewCommand } from "#node/commands/new.command";
import { newKinds } from "#node/functions/new-kinds.function";
import { scaffold } from "#node/scaffold/functions/scaffold.function";

vi.mock("#node/scaffold/functions/scaffold.function", () => ({
  scaffold: vi.fn(() => ({ rel: "apps/handbook", files: ["package.json"] })),
}));

/** The questions, as `askNew` words them. */
const KIND = "What do you want to create?";
const AREA = "Which API area does the service serve?";
const CATEGORY = "Which category folder under packages/?";

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-new-"));
  writeFileSync(join(root, "pnpm-workspace.yaml"), "packages:\n  - packages/*/*\n  - services/*\n");
  mkdirSync(join(root, "packages", "data"), { recursive: true });
  mkdirSync(join(root, "packages", "tooling"), { recursive: true });
  vi.mocked(scaffold).mockClear();
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

const run = (argv: readonly string[], answers?: readonly string[]) =>
  runCommandForTest([NewCommand], ["new", ...argv], {
    cwd: root,
    ...(answers === undefined ? {} : { answers }),
  });

describe("NewCommand in a terminal", () => {
  // @covers sta-2883:FR-003
  it("asks the kind, the name and a service's area, then creates the service", async () => {
    const result = await run([], ["service", "billing", "admin"]);
    expect(result.stderr).toBe("");
    expect(result.exitCode).toBe(0);
    expect(result.asked).toEqual([KIND, "The service's name?", AREA]);
    expect(existsSync(join(root, "services", "billing", "package.json"))).toBe(true);
    expect(result.stdout).toContain("created services/billing");
  });

  // @covers sta-2883:FR-003
  it("asks a package's category and never asks what the line gave", async () => {
    const result = await run(["package", "loyalty-kit"], ["data"]);
    expect(result.exitCode).toBe(0);
    expect(result.asked).toEqual([CATEGORY]);
    expect(existsSync(join(root, "packages", "data", "loyalty-kit", "package.json"))).toBe(true);
  });

  // @covers sta-2883:FR-003
  it("asks nothing when the line gives everything", async () => {
    const result = await run(["service", "billing", "--area", "app"], []);
    expect(result.exitCode).toBe(0);
    expect(result.asked).toEqual([]);
  });

  // @covers sta-2883:FR-003
  it("asks a template kind's description and summary and hands them to the renderer", async () => {
    const result = await run(
      ["app:docs", "handbook", "--dry-run"],
      ["A handbook.", "Use it for the team docs."],
    );
    expect(result.exitCode).toBe(0);
    expect(result.asked).toHaveLength(2);
    expect(vi.mocked(scaffold).mock.calls[0]?.[0]).toMatchObject({
      kind: "app:docs",
      name: "handbook",
      description: "A handbook.",
      summary: "Use it for the team docs.",
      dryRun: true,
    });
  });
});

describe("NewCommand without a terminal", () => {
  // @covers sta-2883:FR-004
  it("exits 2 naming the kind when none is given, as before", async () => {
    const result = await run([]);
    expect(result.exitCode).toBe(2);
    expect(result.asked).toEqual([]);
    expect(result.stderr).toContain("name the kind: package, service, seed-pack");
  });

  // @covers sta-2883:FR-004
  it("exits 2 naming --area for a service without one, as before", async () => {
    const result = await run(["service", "billing"]);
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain("a service needs --area");
    expect(existsSync(join(root, "services", "billing"))).toBe(false);
  });

  // @covers sta-2883:FR-004
  it("exits 2 naming --description, then --summary, for a template kind without them", async () => {
    const bare = await run(["app:docs", "handbook"]);
    expect(bare.exitCode).toBe(2);
    expect(bare.stderr).toContain("Pass --description");
    const described = await run(["app:docs", "handbook", "--description", "A handbook."]);
    expect(described.exitCode).toBe(2);
    expect(described.stderr).toContain("Pass --summary");
    expect(vi.mocked(scaffold)).not.toHaveBeenCalled();
  });

  // @covers sta-2883:FR-004
  it("asks nothing under --json", async () => {
    const result = await run(["service", "billing", "--json"]);
    expect(result.exitCode).toBe(2);
    expect(result.asked).toEqual([]);
  });
});

describe("newKinds", () => {
  // @covers sta-2883:FR-003
  it("offers every kind the body's usage names, in its order", () => {
    expect(newKinds()).toEqual(
      expect.arrayContaining(["package", "service", "seed-pack", "tooling", "app:docs"]),
    );
    expect(newKinds("stackra new <a|b> <name>\n       stackra new <c|a> <name>")).toEqual([
      "a",
      "b",
      "c",
    ]);
  });
});
