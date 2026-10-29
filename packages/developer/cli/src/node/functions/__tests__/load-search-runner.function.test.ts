/**
 * Stackra file contract:
 * Purpose: unit tests of `loadSearchRunner`: `searchReindex` runs the member's own `@stackra/data-maintenance/node`
 *          and `searchStatus` its own `@stackra/search/node`; a status call needs no add-on, and a member without the
 *          package, or whose entry has no runner, fails with the fix.
 * Boundary: test only; each case builds a throwaway member folder with fake packages.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0404 (decision 3); ADR 0462 (decision 1).
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "@stackra/testing";

import { loadSearchRunner } from "#node/functions/load-search-runner.function";

const folders: string[] = [];

afterEach(() => {
  for (const folder of folders.splice(0)) rmSync(folder, { recursive: true, force: true });
});

/** A member folder with each named `@stackra/*` package whose `./node` entry is the given module text. */
function member(entries: Readonly<Record<string, string>>): string {
  const root = mkdtempSync(join(tmpdir(), "stackra-cli-search-"));
  folders.push(root);
  writeFileSync(join(root, "package.json"), '{"name":"member","type":"module"}');
  for (const [name, entry] of Object.entries(entries)) {
    const pkg = join(root, "node_modules", "@stackra", name);
    mkdirSync(pkg, { recursive: true });
    writeFileSync(
      join(pkg, "package.json"),
      `{"name":"@stackra/${name}","type":"module","exports":{"./node":"./node.mjs"}}`,
    );
    writeFileSync(join(pkg, "node.mjs"), entry);
  }
  return root;
}

describe("loadSearchRunner", () => {
  it("runs searchReindex of the add-on and searchStatus of search", async () => {
    const runner = await loadSearchRunner(
      member({
        "data-maintenance": "export const searchReindex = async () => ({ job: 'job_1' });\n",
        search: "export const searchStatus = async () => [];\n",
      }),
    );
    expect(await runner.searchReindex({})).toEqual({ job: "job_1" });
    expect(await runner.searchStatus()).toEqual([]);
  });

  it("answers status without the add-on, and names the fix for a reindex", async () => {
    const runner = await loadSearchRunner(
      member({ search: "export const searchStatus = async () => [];\n" }),
    );
    expect(await runner.searchStatus()).toEqual([]);
    await expect(runner.searchReindex({})).rejects.toThrow(
      "add @stackra/data-maintenance to its dependencies",
    );
  });

  it("fails when the entry exports no runner", async () => {
    const runner = await loadSearchRunner(member({ search: "export const other = 1;\n" }));
    await expect(runner.searchStatus()).rejects.toThrow(
      "@stackra/search/node exports no searchStatus",
    );
  });
});
