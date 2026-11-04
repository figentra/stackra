/**
 * Stackra file contract:
 * Purpose: unit tests of `workspaceTemplate`: the three files of a fresh workspace root, `services/*`, exactly the
 *          catalogs the member names with the `stackra` one pinned to the CLI's version, the registry `.npmrc` with no
 *          credential, and the refusal of a catalog entry the CLI does not ship.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0453; versions policy; STA-1819.
 */
import { describe, expect, it } from "@stackra/testing";
import { parse } from "yaml";

import { workspaceTemplate } from "#node/functions/workspace-template.function";

const files = workspaceTemplate({
  cliVersion: "0.4.0",
  dependencies: {
    "@stackra/app": "catalog:stackra",
    "@types/node": "catalog:",
    oxlint: "catalog:quality",
    typescript: "catalog:build",
    "left-pad": "1.0.0",
  },
});
const content = (path: string): string => files.find((file) => file.path === path)?.content ?? "";

describe("workspaceTemplate", () => {
  it("writes a package.json, the workspace file and the registry .npmrc", () => {
    expect(files.map((file) => file.path)).toEqual([
      "package.json",
      "pnpm-workspace.yaml",
      ".npmrc",
    ]);
    expect(content(".npmrc")).toBe("@stackra:registry=https://registry.figentra.com/\n");
    expect(content(".npmrc")).not.toContain("authToken");
  });

  it("names services/* and only the catalogs the member uses, stackra at the CLI version", () => {
    expect(parse(content("pnpm-workspace.yaml"))).toEqual({
      packages: ["services/*"],
      catalog: { "@types/node": "26.6.4" },
      catalogs: {
        build: { typescript: "7.0.2" },
        quality: { oxlint: "1.86.0" },
        stackra: { "@stackra/app": "0.4.0" },
      },
    });
  });

  it("refuses an entry the CLI ships no version for", () => {
    expect(() =>
      workspaceTemplate({ cliVersion: "0.4.0", dependencies: { nothing: "catalog:" } }),
    ).toThrow("no version for nothing in catalog default");
  });
});
