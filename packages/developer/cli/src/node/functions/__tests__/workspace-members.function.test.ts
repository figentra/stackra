/**
 * Stackra file contract:
 * Purpose: unit tests of `workspaceMembers`: the folders the `packages` globs match, sorted, minus `!` globs and
 *          `node_modules`, and the refusal of a workspace file without a packages list.
 * Boundary: test only; writes a throwaway workspace in the OS temp directory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0010.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { workspaceMembers } from "#node/functions/workspace-members.function";

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-cli-"));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

const member = (path: string) => {
  mkdirSync(join(root, path), { recursive: true });
  writeFileSync(join(root, path, "package.json"), "{}");
};

describe("workspaceMembers", () => {
  it("lists the matched members sorted, without excluded folders or node_modules", () => {
    writeFileSync(
      join(root, "pnpm-workspace.yaml"),
      "packages:\n  - apps/*\n  - packages/*/*\n  - '!packages/legacy/*'\n",
    );
    member("packages/commerce/loyalty-kit");
    member("apps/web");
    member("apps/console");
    member("packages/legacy/old");
    member("apps/web/node_modules/dep");
    mkdirSync(join(root, "apps", "empty"));
    expect(workspaceMembers(root)).toEqual([
      join(root, "apps/console"),
      join(root, "apps/web"),
      join(root, "packages/commerce/loyalty-kit"),
    ]);
  });

  it("refuses a workspace file without a packages list", () => {
    writeFileSync(join(root, "pnpm-workspace.yaml"), "catalog: {}\n");
    expect(() => workspaceMembers(root)).toThrow(/no packages list/);
  });
});
