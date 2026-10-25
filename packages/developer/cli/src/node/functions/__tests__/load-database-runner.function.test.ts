/**
 * Stackra file contract:
 * Purpose: unit tests of `loadDatabaseRunner`: it imports the member's own `@stackra/database/node` and returns its
 *          `migrate` and `rollback`; a member without the package, or whose entry has no runner, fails with the fix.
 * Boundary: test only; each case builds a throwaway member folder with a fake `@stackra/database` package.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0159 (decision 2 as amended).
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "@stackra/testing";

import { loadDatabaseRunner } from "#node/functions/load-database-runner.function";

const folders: string[] = [];

afterEach(() => {
  for (const folder of folders.splice(0)) rmSync(folder, { recursive: true, force: true });
});

/** A member folder whose `@stackra/database/node` is the module text `entry`, or has none when `entry` is null. */
function member(entry: string | null): string {
  const root = mkdtempSync(join(tmpdir(), "stackra-cli-db-"));
  folders.push(root);
  writeFileSync(join(root, "package.json"), '{"name":"member","type":"module"}');
  if (entry !== null) {
    const pkg = join(root, "node_modules", "@stackra", "database");
    mkdirSync(pkg, { recursive: true });
    writeFileSync(
      join(pkg, "package.json"),
      '{"name":"@stackra/database","type":"module","exports":{"./node":"./node.mjs"}}',
    );
    writeFileSync(join(pkg, "node.mjs"), entry);
  }
  return root;
}

describe("loadDatabaseRunner", () => {
  it("returns the member's migrate and rollback", async () => {
    const root = member(
      "export const migrate = async () => ({ applied: ['0001'] });\n" +
        "export const rollback = async () => ({ reverted: [] });\n",
    );
    const runner = await loadDatabaseRunner(root);

    expect(await runner.migrate({ cwd: root, environment: "dev" })).toEqual({ applied: ["0001"] });
    expect(await runner.rollback({ cwd: root, environment: "dev" })).toEqual({ reverted: [] });
  });

  it("fails when the member has no @stackra/database", async () => {
    await expect(loadDatabaseRunner(member(null))).rejects.toThrow(
      "add @stackra/database to its dependencies",
    );
  });

  it("fails when the entry exports no runner", async () => {
    await expect(loadDatabaseRunner(member("export const other = 1;\n"))).rejects.toThrow(
      "exports no migrate and rollback",
    );
  });
});
