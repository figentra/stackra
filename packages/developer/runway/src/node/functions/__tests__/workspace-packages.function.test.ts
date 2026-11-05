/**
 * Stackra file contract:
 * Purpose: unit tests of `workspacePackages`: every named package up to three levels under `packages/`, with its
 *          folder, version (`0.0.0` when absent) and exports (`{}` when absent); node_modules, dot folders, unnamed
 *          manifests and deeper folders are skipped; a repository without `packages/` has none.
 * Boundary: test only; writes a throwaway repository in the OS temp directory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0436 (decision 2).
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { workspacePackages } from "#node/functions/workspace-packages.function";

let repository: string;

beforeEach(() => {
  repository = mkdtempSync(join(tmpdir(), "stackra-runway-packages-"));
});

afterEach(() => {
  rmSync(repository, { recursive: true, force: true });
});

/** Writes `manifest` as the package.json of `path` under the repository. */
function writePackage(path: string, manifest: Record<string, unknown>): void {
  mkdirSync(join(repository, path), { recursive: true });
  writeFileSync(join(repository, path, "package.json"), JSON.stringify(manifest));
}

describe("workspacePackages", () => {
  it("finds the named packages up to three levels down", () => {
    writePackage("packages/application/example", {
      name: "@acme/example",
      version: "0.1.0",
      exports: { "./console": "./src/console.tsx" },
    });
    writePackage("packages/ui", { name: "@acme/ui" });
    writePackage("packages/a/b/c", { name: "@acme/deep" });
    writePackage("packages/a/b/c/d", { name: "@acme/too-deep" });
    writePackage("packages/ui/node_modules/react", { name: "react" });
    writePackage("packages/.cache/x", { name: "@acme/hidden" });
    writePackage("packages/unnamed", { version: "1.0.0" });

    const found = workspacePackages(repository);

    expect([...found.keys()].sort()).toEqual(["@acme/deep", "@acme/example", "@acme/ui"]);
    expect(found.get("@acme/example")).toEqual({
      dir: join(repository, "packages/application/example"),
      version: "0.1.0",
      exports: { "./console": "./src/console.tsx" },
    });
    expect(found.get("@acme/ui")).toEqual({
      dir: join(repository, "packages/ui"),
      version: "0.0.0",
      exports: {},
    });
  });

  it("names the file when a package.json is not valid JSON", () => {
    mkdirSync(join(repository, "packages/broken"), { recursive: true });
    writeFileSync(join(repository, "packages/broken/package.json"), "{ name: ");

    expect(() => workspacePackages(repository)).toThrow(RunwayUnresolvedError);
    expect(() => workspacePackages(repository)).toThrow(
      `${join(repository, "packages/broken/package.json")} is not valid JSON`,
    );
  });

  it("finds none without a packages folder", () => {
    expect(workspacePackages(repository).size).toBe(0);
  });
});
