/**
 * Stackra file contract:
 * Purpose: unit tests of `RunwayEvidenceCommand` on the console, in a temporary repository: it writes
 *          `runway-evidence-<environment>-<member>.json` (or without the member) with the repo from
 *          `providers.github`, gives the same evidence as the `--json` data, reads the Worker's wrangler config for
 *          migrations, and refuses a missing target or a short sha with exit 2 before writing anything. For a service
 *          target it reads each service's gen safety file and compiled migrations, fills `destructive` against the
 *          `--previous` runway-migrations file, writes the keys it ships to `runway-migrations-<environment>.json`,
 *          and refuses a previous file of another environment.
 * Boundary: test only; no network, git or gh runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0533 (decision 3); ADR 0159 (decision 3); STA-2104; STA-2866.
 */
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { runCommandForTest } from "@stackra/console/testing";
import { describe, expect, it } from "@stackra/testing";

import { RunwayEvidenceCommand } from "#node/commands/runway-evidence.command";

const SHA = "d".repeat(40);

/** A repository whose root runway names its GitHub repo and a `docs` Worker, with that Worker's wrangler config. */
function repository(wrangler = '{ "name": "docs" }'): string {
  const folder = mkdtempSync(join(tmpdir(), "runway-evidence-"));
  writeFileSync(join(folder, "pnpm-workspace.yaml"), "packages: []\n");
  mkdirSync(join(folder, "apps/docs"), { recursive: true });
  writeFileSync(join(folder, "apps/docs/wrangler.jsonc"), wrangler);
  writeFileSync(
    join(folder, "runway.yaml"),
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
      "  cloudflare-workers:",
      "    members:",
      "      docs:",
      "        path: apps/docs",
      "release:",
      "  strategy:",
      "    kind: all-at-once",
      "    autoRollback: true",
      "",
    ].join("\n"),
  );
  return folder;
}

/** Writes `services/<member>` with gen's safety file for `rows` and their compiled step files. */
function service(
  cwd: string,
  member: string,
  rows: readonly { id: string; destructive: boolean; files: readonly string[] }[],
): void {
  mkdirSync(join(cwd, "services", member, ".stackra/migrations"), { recursive: true });
  writeFileSync(join(cwd, "services", member, "package.json"), "{}\n");
  writeFileSync(
    join(cwd, "services", member, ".stackra/migration-safety.json"),
    JSON.stringify({ schema: "stackra.migration-safety/v1", migrations: rows }),
  );
  for (const file of rows.flatMap((row) => row.files))
    writeFileSync(
      join(cwd, "services", member, ".stackra/migrations", `${file}.up.sql`),
      "select 1;\n",
    );
}

/** billing: a create, then a column drop. */
const BILLING = [
  { id: "billing.0001_create", destructive: false, files: ["0001_billing_0001_create"] },
  { id: "billing.0002_drop_note", destructive: true, files: ["0002_billing_0002_drop_note"] },
];

/** The JSON file `name` in `cwd`. */
const readJson = (cwd: string, name: string): unknown =>
  JSON.parse(readFileSync(join(cwd, name), "utf8"));

const run = (argv: readonly string[], cwd: string) =>
  runCommandForTest([RunwayEvidenceCommand], ["evidence", ...argv], { cwd });

describe(RunwayEvidenceCommand, () => {
  /** The file the bot reads is named for the environment and member, and holds what --json gives. */
  it("writes the evidence file the bot reads and gives it as --json data", async () => {
    const cwd = repository();

    const result = await run(
      ["production", "--target", "cloudflare-workers", "--member", "docs", "--sha", SHA, "--json"],
      cwd,
    );

    expect(result.exitCode).toBe(0);
    const written = JSON.parse(
      readFileSync(join(cwd, "runway-evidence-production-docs.json"), "utf8"),
    );
    expect(written).toMatchObject({
      schema: "runway.evidence/v1",
      repo: "acme/platform",
      sha: SHA,
      member: "docs",
      rollout: true,
      // a Worker whose wrangler config neither migrates nor binds D1 ships no database change
      destructive: false,
    });
    expect((result.json as { data: unknown }).data).toEqual(written);
  });

  /** A Worker that ships Durable Object migrations goes out at 100%, so it is floor. */
  it("reads the member's wrangler config for migrations", async () => {
    const cwd = repository('{ "name": "docs", "migrations": [{ "tag": "v1" }] }');

    await run(
      ["production", "--target", "cloudflare-workers", "--member", "docs", "--sha", SHA],
      cwd,
    );

    expect(
      JSON.parse(readFileSync(join(cwd, "runway-evidence-production-docs.json"), "utf8")),
    ).toMatchObject({
      rollout: false,
      rolloutDetail: { floorReason: "durable-object-migrations" },
    });
  });

  /** Without a member the file is named for the environment only. */
  it("names the file for the environment when no member is given", async () => {
    const cwd = repository();

    expect(
      (await run(["production", "--target", "encore-cloud", "--sha", SHA], cwd)).exitCode,
    ).toBe(0);
    expect(existsSync(join(cwd, "runway-evidence-production.json"))).toBe(true);
  });

  /** A job must name its target and its full commit; nothing is written otherwise. */
  it("refuses a missing target or a short sha with exit 2", async () => {
    const cwd = repository();

    expect((await run(["production", "--sha", SHA], cwd)).exitCode).toBe(2);
    expect((await run(["production", "--target", "eas", "--sha", "abc123"], cwd)).exitCode).toBe(2);
    expect(existsSync(join(cwd, "runway-evidence-production.json"))).toBe(false);
  });

  /** The first deploy has no baseline, so a destructive migration in the stream is floor; it records what shipped. */
  it("reads the services' migration classes and writes the keys the job ships", async () => {
    const cwd = repository();
    service(cwd, "billing", BILLING);

    expect(
      (await run(["production", "--target", "encore-cloud", "--sha", SHA], cwd)).exitCode,
    ).toBe(0);

    expect(readJson(cwd, "runway-evidence-production.json")).toMatchObject({
      destructive: null,
      destructiveMigrations: [],
    });
    expect(readJson(cwd, "runway-migrations-production.json")).toEqual({
      schema: "runway.migrations/v1",
      environment: "production",
      sha: SHA,
      migrations: ["billing:billing.0001_create", "billing:billing.0002_drop_note"],
    });
  });

  /** Against the previous deploy's keys, only the new drop is destructive; once shipped it is not. */
  it("names the destructive migrations the previous deploy did not ship", async () => {
    const cwd = repository();
    service(cwd, "billing", BILLING);
    writeFileSync(
      join(cwd, "previous.json"),
      JSON.stringify({
        schema: "runway.migrations/v1",
        environment: "production",
        sha: "e".repeat(40),
        migrations: ["billing:billing.0001_create"],
      }),
    );

    await run(
      ["production", "--target", "encore-cloud", "--sha", SHA, "--previous", "previous.json"],
      cwd,
    );
    expect(readJson(cwd, "runway-evidence-production.json")).toMatchObject({
      destructive: true,
      destructiveMigrations: ["billing.0002_drop_note"],
    });

    await run(
      [
        "production",
        "--target",
        "encore-cloud",
        "--member",
        "billing",
        "--sha",
        SHA,
        "--previous",
        "runway-migrations-production.json",
      ],
      cwd,
    );
    expect(readJson(cwd, "runway-evidence-production-billing.json")).toMatchObject({
      destructive: false,
      destructiveMigrations: [],
    });
  });

  /** A compiled file the safety file does not class means gen's classes are stale: unknown, and nothing recorded. */
  it("is null for a stale safety file and writes no keys", async () => {
    const cwd = repository();
    service(cwd, "billing", BILLING.slice(0, 1));
    writeFileSync(
      join(cwd, "services/billing/.stackra/migrations/0002_billing_0002_drop_note.up.sql"),
      "",
    );

    await run(["production", "--target", "encore-cloud", "--sha", SHA], cwd);

    expect(readJson(cwd, "runway-evidence-production.json")).toMatchObject({ destructive: null });
    expect(existsSync(join(cwd, "runway-migrations-production.json"))).toBe(false);
  });

  /** Another environment's keys say nothing about this one. */
  it("refuses a previous file of another environment with exit 2", async () => {
    const cwd = repository();
    writeFileSync(
      join(cwd, "previous.json"),
      JSON.stringify({
        schema: "runway.migrations/v1",
        environment: "staging",
        sha: SHA,
        migrations: [],
      }),
    );

    expect(
      (
        await run(
          ["production", "--target", "encore-cloud", "--sha", SHA, "--previous", "previous.json"],
          cwd,
        )
      ).exitCode,
    ).toBe(2);
    expect(existsSync(join(cwd, "runway-evidence-production.json"))).toBe(false);
  });
});
