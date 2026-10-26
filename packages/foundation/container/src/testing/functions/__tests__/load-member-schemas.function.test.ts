/**
 * Stackra file contract:
 * Purpose: unit tests of `loadMemberSchemas`: it imports each generated schema file of a member root once, in
 *          file-name order, and loads nothing for a member that has no schema folder.
 * Boundary: test only; writes a throwaway member root under the OS temp folder.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 3); registry v3.1 gap G1.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "@stackra/testing";

import { loadMemberSchemas } from "#testing/functions/load-member-schemas.function";

/** What the fake schema files record, in load order. */
const LOADED = "__stackraLoadedSchemas";

const roots: string[] = [];

/** A member root whose `.stackra/gen/schemas` holds `files`, each recording its name when imported. */
function memberWith(files: readonly string[]): string {
  const root = mkdtempSync(join(tmpdir(), "stackra-schemas-"));
  roots.push(root);
  const folder = join(root, ".stackra", "gen", "schemas");
  mkdirSync(folder, { recursive: true });
  for (const file of files)
    writeFileSync(
      join(folder, file),
      `((globalThis as Record<string, string[]>)[${JSON.stringify(LOADED)}] ??= []).push(${JSON.stringify(file)});\n`,
    );
  writeFileSync(join(folder, "notes.md"), "not a schema file\n");
  return root;
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
  Reflect.deleteProperty(globalThis, LOADED);
});

describe(loadMemberSchemas, () => {
  it("imports each schema file once, in file-name order", async () => {
    const root = memberWith(["orders.ts", "catalogue.ts"]);
    await loadMemberSchemas(root);
    await loadMemberSchemas(root);
    expect(Reflect.get(globalThis, LOADED)).toEqual(["catalogue.ts", "orders.ts"]);
  });

  it("loads nothing for a member that has not run gen", async () => {
    const root = mkdtempSync(join(tmpdir(), "stackra-schemas-"));
    roots.push(root);
    await expect(loadMemberSchemas(root)).resolves.toBeUndefined();
    expect(Reflect.get(globalThis, LOADED)).toBeUndefined();
  });
});
