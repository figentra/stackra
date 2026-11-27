/**
 * Stackra file contract:
 * Purpose: unit tests of `DbSchemaCommand` on the console: it runs the member's `describeSchema` narrowed to the
 *          schema and table given, prints one row per table with its row-level security, and returns the whole
 *          description under `--json`.
 * Boundary: test only; the inspector is a fake, so no database is touched.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decision 5); STA-2906.
 */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { runCommandForTest } from "@stackra/console/testing";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { DbSchemaCommand } from "#node/commands/db-schema.command";
import { loadDatabaseInspector } from "#node/functions/load-database-inspector.function";

vi.mock("#node/functions/load-database-inspector.function", () => ({
  loadDatabaseInspector: vi.fn(),
}));

const describeSchema = vi.fn();
let root = "";

/** A forced table and an unprotected one. */
const DESCRIPTION = {
  environment: "dev",
  role: "encore-admin",
  tables: [
    {
      schema: "notes",
      name: "notes",
      columns: [{ name: "id" }, { name: "tenant_id" }],
      primaryKey: ["id"],
      indexes: [],
      rowSecurity: { enabled: true, forced: true },
      policies: [{ name: "pol_notes_tenant_id" }],
    },
    {
      schema: "queue",
      name: "job_batches",
      columns: [{ name: "id" }],
      primaryKey: ["id"],
      indexes: [],
      rowSecurity: { enabled: false, forced: false },
      policies: [],
    },
  ],
};

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-cli-db-schema-"));
  writeFileSync(join(root, "package.json"), '{"name":"notes"}');
  describeSchema.mockReset().mockResolvedValue(DESCRIPTION);
  vi.mocked(loadDatabaseInspector).mockResolvedValue({
    describeSchema,
    queryInScope: vi.fn(),
    migrationStatus: vi.fn(),
  });
  vi.stubEnv("DATABASE_URL", "postgres://127.0.0.1:9500/notes");
});

afterEach(() => {
  vi.unstubAllEnvs();
  rmSync(root, { recursive: true, force: true });
});

describe("DbSchemaCommand", () => {
  it("prints each table with its row-level security", async () => {
    const result = await runCommandForTest([DbSchemaCommand], ["db:schema", "--schema", "notes"], {
      cwd: root,
    });
    expect(result.exitCode).toBe(0);
    expect(describeSchema).toHaveBeenCalledWith(
      expect.objectContaining({ schema: "notes", table: undefined }),
    );
    expect(result.stdout).toMatch(/notes\.notes\s+│?\s*forced/);
    expect(result.stdout).toMatch(/queue\.job_batches\s+│?\s*off/);
  });

  it("returns the description under --json", async () => {
    const result = await runCommandForTest([DbSchemaCommand], ["db:schema", "--json"], {
      cwd: root,
    });
    expect(result.json).toEqual({ ok: true, data: DESCRIPTION });
  });
});
