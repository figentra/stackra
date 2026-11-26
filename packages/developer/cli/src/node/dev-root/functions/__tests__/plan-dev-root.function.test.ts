/**
 * Stackra file contract:
 * Purpose: unit tests of `planDevRoot` and `encoreMembers`: the lane comes from the repository's row of
 *          `lanes.repos` (STACKRA_LANE first), the gateway from the dev infra with the lane applied (4000 when unset),
 *          each service member with a generated Encore app is found with its dev port, database, migrations and
 *          seeders, every member port other than the gateway's is forwarded, the seed profile is `demo` unless set
 *          (`none` runs none) and an unknown profile is refused.
 * Boundary: test only; temporary repositories; writes their dev facts file.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0296 (decisions 1 and 3); STA-2840.
 */
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { encoreMembers } from "#node/dev-root/functions/encore-members.function";
import { planDevRoot } from "#node/dev-root/functions/plan-dev-root.function";
import { CliUsageError } from "#node/errors/cli-usage.error";

let root: string;

/** Writes `content` at `path` under the repository. */
function write(path: string, content: string): void {
  mkdirSync(join(root, path, ".."), { recursive: true });
  writeFileSync(join(root, path), content);
}

/** The root runway of product `pay`, with the given dev infra lines. */
const RUNWAY = (infra: string) =>
  `product:\n  key: pay\nenvironments:\n  dev:\n${infra}    lanes:\n      portStep: 100\n      repos:\n        os: 0\n        pay: 1\n      worktrees: 10\n`;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-dev-root-"));
  write("runway.yaml", RUNWAY("    infra:\n      gateway:\n        port: 4000\n"));
  // billing: a database with migrations and seeders, dev port 4019.
  write("services/billing/encore.app", '{ "id": "pay", "lang": "typescript" }\n');
  write("services/billing/runway.yaml", "version: 3\nenvironments:\n  dev:\n    port: 4019\n");
  write(
    "services/billing/stackra-encore/billing/database.ts",
    'export const database = new SQLDatabase("billing", { migrations: "./migrations" });\n',
  );
  write("services/billing/.stackra/migrations/0001_init.sql", "create table a ();\n");
  write("services/billing/.stackra/entry/seed.ts", "export {};\n");
  // usage: no database, no dev port.
  write("services/usage/encore.app", '{ "id": "pay", "lang": "typescript" }\n');
  write("services/usage/stackra-encore/usage/encore.service.ts", "export {};\n");
  // Not generated yet: no encore.app.
  write("services/draft/package.json", "{}\n");
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("planDevRoot", () => {
  it("plans one app of the generated service members on the repository's lane", () => {
    const plan = planDevRoot(root, { env: {} });
    expect(plan.lane).toBe(10);
    expect(plan.gateway).toBe(5000);
    expect(plan.seed).toBe("demo");
    expect(plan.services).toEqual([
      {
        key: "billing",
        root: join(root, "services/billing"),
        port: 5019,
        database: "billing",
        migrations: true,
        seeders: true,
      },
      {
        key: "usage",
        root: join(root, "services/usage"),
        port: undefined,
        database: undefined,
        migrations: false,
        seeders: false,
      },
    ]);
    expect(plan.forwards).toEqual([{ key: "billing", port: 5019 }]);
    expect(existsSync(join(root, ".stackra/dev/ports.json"))).toBe(true);
    expect(encoreMembers(root)).toEqual([
      join(root, "services/billing"),
      join(root, "services/usage"),
    ]);
  });

  it("takes STACKRA_LANE first, defaults the gateway and runs no seeders on none", () => {
    write("runway.yaml", RUNWAY(""));
    const plan = planDevRoot(root, { env: { STACKRA_LANE: "2" }, seed: "none" });
    expect(plan).toMatchObject({ lane: 2, gateway: 4200 });
    expect(plan.seed).toBeUndefined();
    expect(plan.forwards).toEqual([{ key: "billing", port: 4219 }]);
  });

  it("does not forward a member port that is the gateway's", () => {
    write("services/billing/runway.yaml", "version: 3\nenvironments:\n  dev:\n    port: 4000\n");
    expect(planDevRoot(root, { env: { STACKRA_LANE: "0" } }).forwards).toEqual([]);
  });

  it("refuses an unknown seed profile", () => {
    expect(() => planDevRoot(root, { env: {}, seed: "staging" })).toThrow(CliUsageError);
  });
});
