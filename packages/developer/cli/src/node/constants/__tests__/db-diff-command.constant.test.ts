/**
 * Stackra file contract:
 * Purpose: unit tests of `DB_DIFF_COMMAND`: it exits 0 and says the member agrees, exits 1 with one line per
 *          difference (or a JSON array with `--json`), exits 2 on a gen refusal or a failed replay, and exits 0 for a
 *          member with nothing to compare.
 * Boundary: test only; `checkMigrationDrift` is a fake, so no member is read and no database is started.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decision 3); STA-1808.
 */
import { beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { checkMigrationDrift } from "@stackra/gen/node";

import { DB_DIFF_COMMAND } from "#node/constants/db-diff-command.constant";
import { captureIo } from "#node/functions/capture-io.function";
import type { CliContext } from "#node/types/cli-context.type";

vi.mock("@stackra/gen/node", () => ({ checkMigrationDrift: vi.fn() }));

const MISSING = {
  module: "invoicing",
  table: "tax_documents",
  kind: "missing_column",
  subject: "due_at",
  expected: "timestamptz",
  actual: "-",
} as const;

beforeEach(() => {
  vi.mocked(checkMigrationDrift).mockReset();
});

const run = (values: CliContext["values"] = {}) => {
  const { io, output } = captureIo();
  const code = DB_DIFF_COMMAND.run({
    cwd: "/repo/services/invoicing",
    io,
    values,
    positionals: [],
    rest: [],
    cli: async () => 0,
  });
  return { code, output };
};

describe("DB_DIFF_COMMAND", () => {
  it("exits 0 and says the member agrees when models and migrations match", async () => {
    vi.mocked(checkMigrationDrift).mockResolvedValue({
      member: "invoicing",
      differences: [],
      errors: [],
      compared: true,
    });
    const { code, output } = run();

    expect(await code).toBe(0);
    expect(checkMigrationDrift).toHaveBeenCalledWith("/repo/services/invoicing");
    expect(output()).toBe("db diff: invoicing agrees with its models\n");
  });

  it("exits 1 with one line per difference", async () => {
    vi.mocked(checkMigrationDrift).mockResolvedValue({
      member: "invoicing",
      differences: [MISSING],
      errors: [],
      compared: true,
    });
    const { code, output } = run();

    expect(await code).toBe(1);
    expect(output()).toContain(
      "invoicing  tax_documents  missing_column  due_at  timestamptz  -\n",
    );
    expect(output()).toContain("1 difference(s) in invoicing");
  });

  it("prints the differences as a JSON array with --json", async () => {
    vi.mocked(checkMigrationDrift).mockResolvedValue({
      member: "invoicing",
      differences: [MISSING],
      errors: [],
      compared: true,
    });
    const { io, output } = captureIo();
    const code = await DB_DIFF_COMMAND.run({
      cwd: "/repo/services/invoicing",
      io: { ...io, err: () => {} },
      values: { json: true },
      positionals: [],
      rest: [],
      cli: async () => 0,
    });

    expect(code).toBe(1);
    expect(JSON.parse(output())).toEqual([MISSING]);
  });

  it("prints an empty JSON array when they agree", async () => {
    vi.mocked(checkMigrationDrift).mockResolvedValue({
      member: "invoicing",
      differences: [],
      errors: [],
      compared: true,
    });
    const { code, output } = run({ json: true });

    expect(await code).toBe(0);
    expect(JSON.parse(output())).toEqual([]);
  });

  it("exits 2 when gen refuses a migration", async () => {
    vi.mocked(checkMigrationDrift).mockResolvedValue({
      member: "invoicing",
      differences: [],
      errors: [
        {
          code: "migration_compile_failed",
          file: "src/modules/invoicing/database/migrations/0002-x.migration.ts",
          line: 0,
          column: 0,
          subject: "invoicing.0002_x",
          message: "invoicing.0002_x does not compile: boom",
          fix: "fix it",
        },
      ],
      compared: false,
    });
    const { code, output } = run();

    expect(await code).toBe(2);
    expect(output()).toContain("migration_compile_failed");
    expect(output()).toContain("nothing was compared");
  });

  it("exits 2 with the message when the replay fails or a package is missing", async () => {
    vi.mocked(checkMigrationDrift).mockRejectedValue(
      new Error("0002_invoicing_0001_x failed: syntax error"),
    );
    const { code, output } = run();

    expect(await code).toBe(2);
    expect(output()).toBe("db diff: 0002_invoicing_0001_x failed: syntax error\n");
  });

  it("exits 0 for a member with nothing to compare", async () => {
    vi.mocked(checkMigrationDrift).mockResolvedValue({
      member: "docs",
      differences: [],
      errors: [],
      compared: false,
    });
    const { code, output } = run();

    expect(await code).toBe(0);
    expect(output()).toContain("nothing to compare");
  });
});
