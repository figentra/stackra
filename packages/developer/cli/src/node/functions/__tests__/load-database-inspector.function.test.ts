/**
 * Stackra file contract:
 * Purpose: unit tests of `loadDatabaseInspector`: it imports the member's own `@stackra/database/node` and returns its
 *          three inspections; a member without the package, or whose version has no inspections, fails with the fix.
 * Boundary: test only; each case builds a throwaway member folder with a fake `@stackra/database` package.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decision 5); STA-2906.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "@stackra/testing";

import { loadDatabaseInspector } from "#node/functions/load-database-inspector.function";

const folders: string[] = [];

afterEach(() => {
  for (const folder of folders.splice(0)) rmSync(folder, { recursive: true, force: true });
});

/** A member folder whose `@stackra/database/node` is the module text `entry`, or has none when `entry` is null. */
function member(entry: string | null): string {
  const root = mkdtempSync(join(tmpdir(), "stackra-cli-inspector-"));
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

describe("loadDatabaseInspector", () => {
  it("returns the member's three inspections", async () => {
    const root = member(
      "export const describeSchema = async () => ({ tables: [] });\n" +
        "export const queryInScope = async (query) => ({ scope: query.scope });\n" +
        "export const migrationStatus = async () => ({ pending: 0 });\n",
    );
    const inspector = await loadDatabaseInspector(root);
    expect(await inspector.describeSchema({ env: {} })).toEqual({ tables: [] });
    expect(await inspector.queryInScope({ sql: "select 1", scope: "scp_a", env: {} })).toEqual({
      scope: "scp_a",
    });
    expect(await inspector.migrationStatus({ cwd: root, env: {} })).toEqual({ pending: 0 });
  });

  it("fails when the member has no @stackra/database", async () => {
    await expect(loadDatabaseInspector(member(null))).rejects.toThrow(
      "add @stackra/database to its dependencies",
    );
  });

  it("fails when the member's @stackra/database predates the inspections", async () => {
    await expect(
      loadDatabaseInspector(member("export const migrate = async () => ({ applied: [] });\n")),
    ).rejects.toThrow("exports no describeSchema, queryInScope and migrationStatus");
  });
});
