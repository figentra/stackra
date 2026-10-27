/**
 * Stackra file contract:
 * Purpose: hold `package-cycles.mjs` to its contract: a fixture workspace with a cycle through dependencies,
 *          devDependencies and peerDependencies is reported with its full path; a clean graph reports nothing;
 *          non-workspace dependencies and folders without package.json are ignored.
 * Boundary: writes fixture workspaces into temp directories; reads nothing of this checkout.
 * Runtime: node
 * Governing contract: ADR 0022 (tests live in tests folders); ADR 0003; STA-1373.
 */
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import {
  findPackageCycles,
  packageCycleFindings,
  packageGraph,
  readWorkspaceMembers,
} from "../package-cycles.mjs";

/** A temp workspace with `packages/<dir>/package.json` per entry of `manifests`. */
function workspace(manifests) {
  const root = mkdtempSync(join(tmpdir(), "package-cycles-"));
  writeFileSync(join(root, "pnpm-workspace.yaml"), "packages:\n  - apps/*\n  - packages/*/*\n");
  mkdirSync(join(root, "packages", "data", "no-manifest"), { recursive: true });
  for (const [dir, manifest] of Object.entries(manifests)) {
    mkdirSync(join(root, dir), { recursive: true });
    writeFileSync(join(root, dir, "package.json"), JSON.stringify(manifest));
  }
  return root;
}

test("a cycle through dependencies, devDependencies and peerDependencies is reported with its full path", () => {
  const root = workspace({
    "packages/foundation/a": {
      name: "@stackra/a",
      dependencies: { "@stackra/b": "workspace:*", zod: "catalog:" },
    },
    "packages/foundation/b": {
      name: "@stackra/b",
      devDependencies: { "@stackra/c": "workspace:*" },
    },
    "packages/foundation/c": {
      name: "@stackra/c",
      peerDependencies: { "@stackra/a": "workspace:*" },
    },
    "apps/web": { name: "@figentra/web", dependencies: { "@stackra/a": "workspace:*" } },
  });
  assert.deepEqual(
    readWorkspaceMembers(root).map((member) => member.dir),
    ["apps/web", "packages/foundation/a", "packages/foundation/b", "packages/foundation/c"],
  );
  assert.deepEqual(packageGraph(readWorkspaceMembers(root)).get("@stackra/a"), ["@stackra/b"]);
  assert.deepEqual(packageCycleFindings(root), [
    {
      dir: "pnpm-workspace.yaml",
      text: "package cycle: @stackra/a → @stackra/b → @stackra/c → @stackra/a (break it: turbo refuses every task while it exists)",
    },
  ]);
});

test("a clean graph reports no cycle", () => {
  const root = workspace({
    "packages/foundation/a": { name: "@stackra/a" },
    "packages/foundation/b": { name: "@stackra/b", dependencies: { "@stackra/a": "workspace:*" } },
    "apps/web": {
      name: "@figentra/web",
      dependencies: { "@stackra/a": "workspace:*" },
      devDependencies: { "@stackra/b": "workspace:*", vitest: "catalog:quality" },
    },
  });
  assert.deepEqual(packageCycleFindings(root), []);
});

test("each cycle is reported once, starting at its smallest name, and a self-dependency counts", () => {
  const graph = new Map([
    ["z", ["y"]],
    ["y", ["z"]],
    ["m", ["m"]],
    ["a", ["y"]],
  ]);
  assert.deepEqual(findPackageCycles(graph), [
    ["m", "m"],
    ["y", "z", "y"],
  ]);
});
