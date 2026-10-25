/**
 * Stackra file contract:
 * Purpose: unit tests of `workspaceRoot`: the folder with `pnpm-workspace.yaml` above a member, and the working folder
 *          itself outside a workspace.
 * Boundary: test only; writes a throwaway workspace in the OS temp directory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); the Workspace Layout rule.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { workspaceRoot } from "#node/functions/workspace-root.function";

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-cli-"));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("workspaceRoot", () => {
  it("walks up to the workspace file", () => {
    writeFileSync(join(root, "pnpm-workspace.yaml"), "packages: []\n");
    mkdirSync(join(root, "packages/data/storage"), { recursive: true });
    expect(workspaceRoot(join(root, "packages/data/storage"))).toBe(root);
  });

  it("answers the working folder outside a workspace", () => {
    expect(workspaceRoot(root)).toBe(root);
  });
});
