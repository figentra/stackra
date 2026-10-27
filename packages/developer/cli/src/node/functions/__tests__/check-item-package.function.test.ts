/**
 * Stackra file contract:
 * Purpose: unit tests of `checkItemPackage`: a well-formed skill, mcp item and package pass; a wrong scope, a name
 *          without its kind prefix, a package named like an item, an unknown kind and a skill without SKILL.md are
 *          each refused with a line.
 * Boundary: test only; writes throwaway members in the OS temp directory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0453 (decisions 7 and 11).
 */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { checkItemPackage } from "#node/functions/check-item-package.function";

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "stackra-publish-"));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

// Each member gets its own directory, so a file one member writes never satisfies the next.
const member = (manifest: Record<string, unknown>, files: string[] = []) => {
  const root = mkdtempSync(join(dir, "member-"));
  writeFileSync(join(root, "package.json"), JSON.stringify(manifest));
  for (const file of files) writeFileSync(join(root, file), "x");
  return checkItemPackage(root);
};

describe("checkItemPackage", () => {
  it("passes a skill, an mcp item and a package", () => {
    expect(
      member({ name: "@stackra/skill-archify", stackra: { kind: "skill" } }, ["SKILL.md"]),
    ).toEqual([]);
    expect(
      member({
        name: "@stackra-pro/mcp-github",
        stackra: { kind: "mcp", mcp: { command: "npx" } },
      }),
    ).toEqual([]);
    expect(member({ name: "@stackra/cli" })).toEqual([]);
  });

  it("refuses each wrong shape", () => {
    expect(member({ name: "@acme/skill-x", stackra: { kind: "skill" } }, ["SKILL.md"])).toEqual([
      "@acme/skill-x is not in @stackra or @stackra-pro",
    ]);
    expect(member({ name: "@stackra/archify", stackra: { kind: "skill" } }, ["SKILL.md"])).toEqual([
      "a skill item must be named @<scope>/skill-<name>, not @stackra/archify",
    ]);
    expect(
      member({ name: "@stackra/agent-x", stackra: { kind: "skill" } }, ["SKILL.md"]),
    ).toHaveLength(1);
    expect(member({ name: "@stackra/skill-x" })).toEqual([
      "@stackra/skill-x is named like a skill item but stackra.kind is package",
    ]);
    expect(member({ name: "@stackra/skill-x", stackra: { kind: "skill" } })).toEqual([
      "a skill item needs SKILL.md at its root",
    ]);
    expect(member({ name: "@stackra/theme-x", stackra: { kind: "theme" } }).length).toBeGreaterThan(
      0,
    );
  });

  it("refuses a member without package.json", () => {
    expect(checkItemPackage(dir)).toEqual([`no package.json in ${dir}`]);
  });
});
