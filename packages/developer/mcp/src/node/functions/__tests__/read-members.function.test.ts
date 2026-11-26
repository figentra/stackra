/**
 * Stackra file contract:
 * Purpose: unit tests of `readMembers` and `resolveMember`: member folders of apps, category packages, services and
 *          workers are read in path order with their package name and manifest; a folder with neither is not a
 *          member; a member resolves by key, package name or folder, and an unknown one is refused listing them.
 * Boundary: test only; writes throwaway files in the OS temp directory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (rule R10); ADR 0282 (decision 5); STA-2873.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { readMembers } from "#node/functions/read-members.function";
import { resolveMember } from "#node/functions/resolve-member.function";

let root: string;

/** Writes `value` as JSON at `path` under the root. */
function writeJson(path: string, value: unknown): void {
  mkdirSync(join(root, path, ".."), { recursive: true });
  writeFileSync(join(root, path), JSON.stringify(value));
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-mcp-"));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("readMembers", () => {
  it("reads every member folder in path order, with its package name and manifest", () => {
    writeJson("workers/edge/package.json", { name: "@acme/edge" });
    writeJson("services/commerce/stackra.manifest.json", { member: "commerce" });
    writeJson("packages/data/search/package.json", { name: "@acme/search" });
    writeJson("packages/data/search/stackra.manifest.json", { member: "search" });
    writeJson("apps/web/package.json", { version: "1" });
    mkdirSync(join(root, "apps", "empty"));

    expect(readMembers(root)).toEqual([
      { path: "apps/web" },
      { path: "packages/data/search", packageName: "@acme/search", manifest: { member: "search" } },
      { path: "services/commerce", manifest: { member: "commerce" } },
      { path: "workers/edge", packageName: "@acme/edge" },
    ]);
  });

  it("reads none in a repository without member folders", () => {
    expect(readMembers(root)).toEqual([]);
  });
});

describe("resolveMember", () => {
  it("finds a member by key, package name or folder, and refuses an unknown one", () => {
    writeJson("services/commerce/package.json", { name: "@acme/service-commerce" });
    writeJson("services/commerce/stackra.manifest.json", { member: "commerce" });
    writeJson("apps/web/package.json", { name: "@acme/web" });

    for (const given of [
      "commerce",
      "@acme/service-commerce",
      "services/commerce",
      "./services/commerce/",
    ])
      expect(resolveMember(root, given).path).toBe("services/commerce");
    expect(() => resolveMember(root, "billing")).toThrow(
      expect.objectContaining({
        message: 'No member named "billing"',
        fix: "name one of: apps/web, commerce",
      }),
    );
  });
});
