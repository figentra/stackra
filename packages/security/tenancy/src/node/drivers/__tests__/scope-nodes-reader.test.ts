/**
 * Stackra file contract:
 * Purpose: proves `scope.scope_nodes` is a platform table with one reader outside its owner (ADR 0239, amendment of
 *          2026-11-07, item 2 and its allowed system readers): no source file under `packages/` names the table, its
 *          model, its service or its Postgres driver, except the scope package that owns it and `CallIsolationDriver`;
 *          the `ScopeTree` port, which that driver reads through, has exactly the readers the amendment names, so a new
 *          one fails here until the ADR names it; and no file in an `actions/`, `queries/` or `listeners/` folder names
 *          the port, except the one exception the amendment names.
 * Boundary: test only; reads the repository's `packages/` sources with node:fs (no `node_modules`, `dist`, `.stackra`,
 *           `__tests__` or `*.test.*` file), never a database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0239 (amendment of 2026-11-07); ADR 0327 (decision 8); ADR 0022 (test placement).
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "@stackra/testing";

const REPO = fileURLToPath(new URL("../../../../../../../", import.meta.url));
const PACKAGES = join(REPO, "packages");
const OWNER = "packages/security/scope/";
const DRIVER = "packages/security/tenancy/src/node/drivers/call-isolation.driver.ts";
const SKIPPED = new Set(["node_modules", "dist", ".stackra", "__tests__", ".turbo"]);
const SOURCE = /\.(?:ts|tsx|mts|mjs|sql)$/;
const TABLE = /\bscope_nodes\b|\bScopeNodeModel\b|\bScopeNodeService\b|\bPostgresScopeTreeDriver\b/;
const PORT = /\bScopeTree\b/;

/** The bootstrap-operator action, the amendment's one named exception to "never in an action" (TODO in the ADR). */
const EXCEPTION = "packages/security/identity/src/node/actions/bootstrap-operator.action.ts";
const CALL_UNIT = /\/(?:actions|queries|listeners)\//;

/** The isolation driver and the allowed system readers of the `ScopeTree` port outside the owner (the amendment's table). */
const PORT_CONSUMERS = [
  "packages/security/iam/src/core/drivers/iam-access-control.driver.ts",
  EXCEPTION,
  "packages/security/tenancy/src/core/drivers/region-guard.driver.ts",
  "packages/security/tenancy/src/core/drivers/tenancy-cron-scopes.driver.ts",
  "packages/security/tenancy/src/core/drivers/tenant-placement-connection-resolver.driver.ts",
  "packages/security/tenancy/src/core/drivers/tenant-scope-ownership.driver.ts",
  "packages/security/tenancy/src/core/drivers/tenant-scope-resolver.driver.ts",
  "packages/security/tenancy/src/core/functions/tenant-of.function.ts",
  DRIVER,
];

/** Every source file below `dir`, as a path relative to the repository root. */
function sourcesOf(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (SKIPPED.has(entry.name)) return [];
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourcesOf(path);
    return SOURCE.test(entry.name) && !entry.name.includes(".test.") ? [relative(REPO, path)] : [];
  });
}

/** The files outside the owner whose text matches `pattern`. */
function namingFiles(files: readonly string[], pattern: RegExp): string[] {
  return files
    .filter(
      (file) => !file.startsWith(OWNER) && pattern.test(readFileSync(join(REPO, file), "utf8")),
    )
    .sort();
}

describe("scope.scope_nodes readers", () => {
  const files = sourcesOf(PACKAGES);

  it("scans the packages", () => {
    expect(files.length).toBeGreaterThan(1000);
    expect(files).toContain(DRIVER);
  });

  it("is named outside the scope package only by the isolation driver", () => {
    expect(namingFiles(files, TABLE)).toEqual([DRIVER]);
  });

  it("is read through the ScopeTree port only by the consumers the ADR names", () => {
    expect(namingFiles(files, PORT)).toEqual([...PORT_CONSUMERS].sort());
  });

  it("is never taken by an action, a query or a listener, except the named exception", () => {
    const units = files.filter(
      (file) => CALL_UNIT.test(file) && PORT.test(readFileSync(join(REPO, file), "utf8")),
    );
    expect(units).toEqual([EXCEPTION]);
  });
});
