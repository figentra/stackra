/**
 * Stackra file contract:
 * Purpose: unit tests of `DbQueryCommand` on the console: it runs the member's `queryInScope` with the tenant, query,
 *          role, limit and timeout given and the connection from the environment, prints the rows, returns them under
 *          `--json`, and passes the inspection's refusal on as a usage error (exit 2, code `inspection_refused`).
 * Boundary: test only; the inspector is a fake, so no database is touched.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decision 5); STA-2906.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { UsageError } from "@stackra/console";
import { runCommandForTest } from "@stackra/console/testing";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { DbQueryCommand } from "#node/commands/db-query.command";
import { loadDatabaseInspector } from "#node/functions/load-database-inspector.function";

vi.mock("#node/functions/load-database-inspector.function", () => ({
  loadDatabaseInspector: vi.fn(),
}));

const ACME = "scp_01jab3k4m5n6p7q8r9s0t1v2w3";
const queryInScope = vi.fn();
let root = "";

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-cli-db-query-"));
  mkdirSync(join(root, "services", "notes"), { recursive: true });
  writeFileSync(join(root, "services", "notes", "package.json"), '{"name":"notes"}');
  queryInScope.mockReset();
  vi.mocked(loadDatabaseInspector).mockReset();
  vi.mocked(loadDatabaseInspector).mockResolvedValue({
    describeSchema: vi.fn(),
    queryInScope,
    migrationStatus: vi.fn(),
  });
  vi.stubEnv("DATABASE_URL", "postgres://127.0.0.1:9500/notes");
  vi.stubEnv("STACKRA_ENVIRONMENT", undefined);
});

afterEach(() => {
  vi.unstubAllEnvs();
  rmSync(root, { recursive: true, force: true });
});

/** What the fake answers for two rows, cut at the limit. */
const ANSWER = {
  environment: "dev",
  role: "encore-admin",
  scope: ACME,
  columns: ["id", "body"],
  rows: [{ id: 1, body: "first" }],
  rowCount: 1,
  truncated: true,
  limit: 1,
};

describe("DbQueryCommand", () => {
  it("runs the member's queryInScope as the tenant and prints the rows", async () => {
    queryInScope.mockResolvedValue(ANSWER);
    const result = await runCommandForTest(
      [DbQueryCommand],
      [
        "db:query",
        ACME,
        "select id, body from notes.notes",
        "--member",
        "services/notes",
        "--role",
        "stackra_app",
        "--limit",
        "1",
        "--timeout",
        "2000",
      ],
      { cwd: root },
    );
    expect(result.exitCode).toBe(0);
    expect(loadDatabaseInspector).toHaveBeenCalledWith(join(root, "services", "notes"));
    expect(queryInScope).toHaveBeenCalledWith(
      expect.objectContaining({
        sql: "select id, body from notes.notes",
        scope: ACME,
        role: "stackra_app",
        limit: 1,
        timeoutMs: 2000,
      }),
    );
    expect(queryInScope.mock.calls[0]?.[0].env.DATABASE_URL).toBe(
      "postgres://127.0.0.1:9500/notes",
    );
    expect(result.stdout).toContain(`as encore-admin under ${ACME}: 1 row (cut at 1)`);
    expect(result.stdout).toContain("first");
  });

  it("returns the rows under --json, with the defaults and no role", async () => {
    queryInScope.mockResolvedValue(ANSWER);
    const result = await runCommandForTest(
      [DbQueryCommand],
      ["db:query", ACME, "select 1", "--member", "services/notes", "--json"],
      { cwd: root },
    );
    expect(result.json).toEqual({ ok: true, data: ANSWER });
    expect(queryInScope).toHaveBeenCalledWith(
      expect.objectContaining({ role: undefined, limit: 100, timeoutMs: 5000 }),
    );
  });

  it("passes the inspection's refusal on as a usage error", async () => {
    class InspectionRefusedError extends UsageError {
      override name = "InspectionRefusedError";
    }
    queryInScope.mockRejectedValue(
      new InspectionRefusedError("the role postgres can bypass row-level security"),
    );
    const result = await runCommandForTest(
      [DbQueryCommand],
      ["db:query", ACME, "select 1", "--member", "services/notes", "--json"],
      { cwd: root },
    );
    expect(result.exitCode).toBe(2);
    expect(result.json).toMatchObject({
      ok: false,
      error: {
        code: "inspection_refused",
        message: "the role postgres can bypass row-level security",
      },
    });
  });

  it("refuses a limit above 1000 before it connects", async () => {
    const result = await runCommandForTest(
      [DbQueryCommand],
      ["db:query", ACME, "select 1", "--member", "services/notes", "--limit", "5000"],
      { cwd: root },
    );
    expect(result.exitCode).toBe(2);
    expect(queryInScope).not.toHaveBeenCalled();
  });
});
