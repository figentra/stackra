/**
 * Stackra file contract:
 * Purpose: unit tests of `RunwayMigrationsRecordCommand` on the console, in a temporary repository: after a deploy it
 *          writes `runway-migrations-<environment>[-<member>].json` with the `<member>:<id>` key of every migration
 *          the shipped services hold, which `runway evidence --previous` reads back; it writes nothing (and warns)
 *          when a service's classes are missing or stale, and refuses a client target or a short sha with exit 2.
 * Boundary: test only; no network, git or gh runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0533 (decision 3); ADR 0159 (decision 3); STA-2866.
 */
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { runCommandForTest } from "@stackra/console/testing";
import { describe, expect, it } from "@stackra/testing";

import { RunwayEvidenceCommand } from "#node/commands/runway-evidence.command";
import { RunwayMigrationsRecordCommand } from "#node/commands/runway-migrations-record.command";

const SHA = "d".repeat(40);

/** A repository with a root runway and `services/billing`, a create and then a column drop, classified by gen. */
function repository(): string {
  const cwd = mkdtempSync(join(tmpdir(), "runway-migrations-record-"));
  writeFileSync(join(cwd, "pnpm-workspace.yaml"), "packages: []\n");
  writeFileSync(
    join(cwd, "runway.yaml"),
    [
      "version: 3",
      "project: acme",
      "providers:",
      "  github:",
      "    org: acme",
      "    repo: platform",
      "environments:",
      "  production:",
      "    destinations:",
      "      web: cloudflare-workers",
      "targets:",
      "  encore-cloud:",
      "    cloud: aws",
      "",
    ].join("\n"),
  );
  const rows = [
    { id: "billing.0001_create", destructive: false, files: ["0001_billing_0001_create"] },
    { id: "billing.0002_drop_note", destructive: true, files: ["0002_billing_0002_drop_note"] },
  ];
  mkdirSync(join(cwd, "services/billing/.stackra/migrations"), { recursive: true });
  writeFileSync(join(cwd, "services/billing/package.json"), "{}\n");
  writeFileSync(
    join(cwd, "services/billing/.stackra/migration-safety.json"),
    JSON.stringify({ schema: "stackra.migration-safety/v1", migrations: rows }),
  );
  for (const file of rows.flatMap((row) => row.files))
    writeFileSync(
      join(cwd, "services/billing/.stackra/migrations", `${file}.up.sql`),
      "select 1;\n",
    );
  return cwd;
}

const record = (argv: readonly string[], cwd: string) =>
  runCommandForTest([RunwayMigrationsRecordCommand], ["migrations:record", ...argv], { cwd });

const evidence = (argv: readonly string[], cwd: string) =>
  runCommandForTest([RunwayEvidenceCommand], ["evidence", ...argv], { cwd });

/** The JSON file `name` in `cwd`. */
const readJson = (cwd: string, name: string): unknown =>
  JSON.parse(readFileSync(join(cwd, name), "utf8"));

describe(RunwayMigrationsRecordCommand, () => {
  /** What a successful deploy applied, keyed per member, sorted, and named for the environment. */
  it("writes the keys of the migrations the deploy applied", async () => {
    const cwd = repository();

    const result = await record(
      ["production", "--target", "encore-cloud", "--sha", SHA, "--json"],
      cwd,
    );

    expect(result.exitCode).toBe(0);
    const written = readJson(cwd, "runway-migrations-production.json");
    expect(written).toEqual({
      schema: "runway.migrations/v1",
      environment: "production",
      sha: SHA,
      migrations: ["billing:billing.0001_create", "billing:billing.0002_drop_note"],
    });
    expect((result.json as { data: unknown }).data).toEqual(written);
  });

  /** The next deploy's evidence reads the record back: the applied drop is no longer new. */
  it("is the --previous the next deploy's evidence reads", async () => {
    const cwd = repository();
    await record(
      ["production", "--target", "encore-cloud", "--member", "billing", "--sha", SHA],
      cwd,
    );

    const result = await evidence(
      [
        "production",
        "--target",
        "encore-cloud",
        "--sha",
        SHA,
        "--previous",
        "runway-migrations-production-billing.json",
      ],
      cwd,
    );

    expect(result.exitCode).toBe(0);
    expect(readJson(cwd, "runway-evidence-production.json")).toMatchObject({ destructive: false });
  });

  /** Unknown classes are never recorded as applied: the next evidence reads the older record, so more is new. */
  it("writes nothing when gen has not run", async () => {
    const cwd = repository();
    writeFileSync(join(cwd, "services/billing/.stackra/migration-safety.json"), "not json");

    const result = await record(["production", "--target", "encore-cloud", "--sha", SHA], cwd);

    expect(result.exitCode).toBe(0);
    expect(existsSync(join(cwd, "runway-migrations-production.json"))).toBe(false);
  });

  it("refuses a client target or a short sha with exit 2", async () => {
    const cwd = repository();

    expect((await record(["production", "--target", "eas", "--sha", SHA], cwd)).exitCode).toBe(2);
    expect((await record(["production", "--sha", SHA], cwd)).exitCode).toBe(2);
    expect(
      (await record(["production", "--target", "encore-cloud", "--sha", "abc"], cwd)).exitCode,
    ).toBe(2);
    expect(existsSync(join(cwd, "runway-migrations-production.json"))).toBe(false);
  });
});
