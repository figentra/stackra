/**
 * Stackra file contract:
 * Purpose: unit tests of `DbMigrationsStatusCommand` on the console: it runs the member's `migrationStatus` in the
 *          member's folder, prints each file with whether it is applied or edited, and returns the status under
 *          `--json`.
 * Boundary: test only; the inspector is a fake, so no database is touched.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0159; ADR 0282 (decision 5); STA-2906.
 */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { runCommandForTest } from "@stackra/console/testing";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { DbMigrationsStatusCommand } from "#node/commands/db-migrations-status.command";
import { loadDatabaseInspector } from "#node/functions/load-database-inspector.function";

vi.mock("#node/functions/load-database-inspector.function", () => ({
  loadDatabaseInspector: vi.fn(),
}));

const migrationStatus = vi.fn();
let root = "";

const STATUS = {
  environment: "dev",
  version: 2,
  dirty: false,
  ledger: true,
  migrations: [
    { version: 1, name: "0001_notes_0001_create", applied: true, edited: false },
    { version: 2, name: "0002_notes_0002_add", applied: true, edited: true },
    { version: 3, name: "0003_notes_0003_index", applied: false, edited: false },
  ],
  pending: 1,
  missing: [],
};

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-cli-db-migrations-"));
  writeFileSync(join(root, "package.json"), '{"name":"notes"}');
  migrationStatus.mockReset().mockResolvedValue(STATUS);
  vi.mocked(loadDatabaseInspector).mockResolvedValue({
    describeSchema: vi.fn(),
    queryInScope: vi.fn(),
    migrationStatus,
  });
  vi.stubEnv("DATABASE_URL", "postgres://127.0.0.1:9500/notes");
});

afterEach(() => {
  vi.unstubAllEnvs();
  rmSync(root, { recursive: true, force: true });
});

describe("DbMigrationsStatusCommand", () => {
  it("reads the member's status in its folder and prints each file", async () => {
    const result = await runCommandForTest([DbMigrationsStatusCommand], ["db:migrations:status"], {
      cwd: root,
    });
    expect(result.exitCode).toBe(0);
    expect(migrationStatus).toHaveBeenCalledWith(expect.objectContaining({ cwd: root }));
    expect(result.stdout).toMatch(/0002_notes_0002_add\s+│?\s*yes\s+│?\s*yes/);
    expect(result.stdout).toMatch(/0003_notes_0003_index\s+│?\s*no/);
  });

  it("returns the status under --json", async () => {
    const result = await runCommandForTest(
      [DbMigrationsStatusCommand],
      ["db:migrations:status", "--json"],
      { cwd: root },
    );
    expect(result.json).toEqual({ ok: true, data: STATUS });
  });
});
