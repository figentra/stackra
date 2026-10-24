/**
 * Stackra file contract:
 * Purpose: unit tests of `readManifests`: the committed manifests of apps, category packages, services and workers are
 *          read in path order; a member without one and a repository without member folders are skipped.
 * Boundary: test only; writes throwaway files in the OS temp directory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (rule R10); ADR 0282 (decision 5).
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { readManifests } from "#node/functions/read-manifests.function";

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-mcp-"));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

/** Writes a manifest for `member` under `folder`. */
function manifest(folder: string, member: string): void {
  mkdirSync(join(root, folder), { recursive: true });
  writeFileSync(
    join(root, folder, "stackra.manifest.json"),
    JSON.stringify({ member, package: `@acme/${member}`, version: "1" }),
  );
}

describe("readManifests", () => {
  it("reads every member's manifest in path order", () => {
    manifest("services/notifications", "notifications");
    manifest("services/commerce", "commerce");
    manifest("apps/console", "console");
    manifest("packages/data/loyalty-kit", "loyalty_kit");
    manifest("workers/static", "static");
    mkdirSync(join(root, "services", "draft"), { recursive: true });

    expect(readManifests(root).map((entry) => entry.member)).toEqual([
      "console",
      "loyalty_kit",
      "commerce",
      "notifications",
      "static",
    ]);
  });

  it("returns nothing for a repository without members", () => {
    expect(readManifests(root)).toEqual([]);
  });
});
