/**
 * Stackra file contract:
 * Purpose: unit tests of `LsCommand` on the console: section counts without a section, one identity per row with
 *          one, every member's manifest with its package at the workspace root (the rows are the `--json` data), a
 *          drawn table, and the refusals (no manifest exits 1, an unknown section or an extra argument exits 2).
 * Boundary: test only; writes throwaway manifests in the OS temp directory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 20); STA-1966.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { runCommandForTest } from "@stackra/console/testing";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { LsCommand } from "#node/commands/ls.command";

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-cli-"));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

const manifest = (folder: string, name: string) => {
  mkdirSync(folder, { recursive: true });
  writeFileSync(join(folder, "package.json"), "{}");
  writeFileSync(
    join(folder, "stackra.manifest.json"),
    JSON.stringify({
      member: "commerce",
      package: name,
      version: "1",
      actions: [
        { key: "orders.order.cancel@1", kind: "action" },
        { key: "orders.order.list@1", kind: "query" },
      ],
      events: [{ name: "orders.order.paid.v1" }],
    }),
  );
};

const ls = (args: string[]) => runCommandForTest([LsCommand], ["ls", ...args], { cwd: root });

const data = async (args: string[]) => {
  const result = await ls([...args, "--json"]);
  expect(result.exitCode).toBe(0);
  return (result.json as { data: unknown }).data;
};

describe("LsCommand", () => {
  it("counts each section without a section", async () => {
    manifest(root, "@acme/service-commerce");
    expect(await data([])).toEqual(
      [
        ["modules", 0],
        ["actions", 2],
        ["events", 1],
        ["permissions", 0],
        ["errors", 0],
        ["models", 0],
        ["drivers", 0],
      ].map(([section, count]) => ({ section, count })),
    );
  });

  it("lists one identity per row for a section, drawn as a table", async () => {
    manifest(root, "@acme/service-commerce");
    expect(await data(["actions"])).toEqual([
      { identity: "orders.order.cancel@1" },
      { identity: "orders.order.list@1" },
    ]);
    const drawn = await ls(["events"]);
    expect(drawn.exitCode).toBe(0);
    expect(drawn.stdout).toContain("orders.order.paid.v1");
  });

  it("reads every member's manifest at the workspace root, with its package", async () => {
    writeFileSync(join(root, "pnpm-workspace.yaml"), "packages:\n  - services/*\n");
    manifest(join(root, "services", "commerce"), "@acme/service-commerce");
    expect(await data(["events"])).toEqual([
      { package: "@acme/service-commerce", identity: "orders.order.paid.v1" },
    ]);
  });

  it("fails without a manifest and refuses an unknown section or extra argument", async () => {
    expect((await ls([])).exitCode).toBe(1);
    manifest(root, "@acme/service-commerce");
    expect((await ls(["routes"])).exitCode).toBe(2);
    expect((await ls(["actions", "events"])).exitCode).toBe(2);
  });
});
