/**
 * Stackra file contract:
 * Purpose: unit tests of `prepareDevData`: once the gateway answers, each member with a database gets Encore's
 *          connection string and runs its own `stackra db migrate` then `stackra db seed --profile <seed>` with
 *          `DATABASE_URL` set; no profile runs no seeder; a failing member is named and the next still runs; a gateway
 *          that never answers touches no database; a database that is not on this machine is refused and named while
 *          the next still runs; a run that ended first says nothing; nothing to do waits for nothing.
 * Boundary: test only; fake tools, no process starts.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0159 (decision 2); ADR 0190; STA-2840.
 */
import { describe, expect, it } from "@stackra/testing";

import { prepareDevData } from "#node/dev-root/functions/prepare-dev-data.function";
import type { DevRootPlan } from "#node/dev-root/types/dev-root-plan.type";
import { captureIo } from "#node/functions/capture-io.function";
import type { ToolRun } from "#node/types/tool-run.type";

/** A plan with two members that have databases and one that has none. */
const plan = (seed: string | undefined): DevRootPlan => ({
  root: "/r",
  lane: 0,
  gateway: 4000,
  forwards: [],
  ...(seed === undefined ? {} : { seed }),
  services: [
    {
      key: "billing",
      root: "/r/services/billing",
      database: "billing",
      migrations: true,
      seeders: true,
    },
    {
      key: "usage",
      root: "/r/services/usage",
      database: "usage",
      migrations: true,
      seeders: false,
    },
    { key: "static", root: "/r/services/static", migrations: false, seeders: false },
  ],
});

/** Fake tools that record every call; `failing` exits 3; `remote` gets a connection string to another machine. */
function tools(up: boolean, failing?: string, remote?: string) {
  const runs: ToolRun[] = [];
  const captured: string[][] = [];
  const waited: string[] = [];
  return {
    runs,
    captured,
    waited,
    tools: {
      run: async (tool: ToolRun) => {
        runs.push(tool);
        return tool.cwd.endsWith(failing ?? "-") ? 3 : 0;
      },
      capture: async (command: string, args: readonly string[], options: { cwd: string }) => {
        captured.push([command, ...args, options.cwd]);
        const host = args[2] === remote ? "db.example.com" : "localhost";
        return `postgresql://${host}:5432/${args[2]}\n`;
      },
      waitFor: async (url: string) => {
        waited.push(url);
        return up;
      },
    },
  };
}

describe("prepareDevData", () => {
  it("migrates and seeds each member with a database once the gateway answers", async () => {
    const fake = tools(true);
    const { io, output } = captureIo();
    expect(await prepareDevData(plan("demo"), "/r/.stackra/dev/encore", fake.tools, io)).toBe(0);
    expect(fake.waited).toEqual(["http://localhost:4000/"]);
    expect(fake.captured).toEqual([
      ["encore", "db", "conn-uri", "billing", "/r/.stackra/dev/encore"],
      ["encore", "db", "conn-uri", "usage", "/r/.stackra/dev/encore"],
    ]);
    expect(
      fake.runs.map((run) => [run.cwd, run.command, ...run.args, run.env?.["DATABASE_URL"]]),
    ).toEqual([
      [
        "/r/services/billing",
        "stackra",
        "db",
        "migrate",
        "--env",
        "dev",
        "postgresql://localhost:5432/billing",
      ],
      [
        "/r/services/billing",
        "stackra",
        "db",
        "seed",
        "--profile",
        "demo",
        "--env",
        "dev",
        "postgresql://localhost:5432/billing",
      ],
      [
        "/r/services/usage",
        "stackra",
        "db",
        "migrate",
        "--env",
        "dev",
        "postgresql://localhost:5432/usage",
      ],
    ]);
    expect(output()).toContain("migrated and seeded billing, usage");
    expect(output()).not.toContain("postgresql://");
  });

  it("runs no seeder without a profile, and names a failing member while the next still runs", async () => {
    const fake = tools(true, "billing");
    const { io, output } = captureIo();
    expect(await prepareDevData(plan(undefined), "/app", fake.tools, io)).toBe(3);
    expect(fake.runs.map((run) => `${run.cwd} ${run.args[1]}`)).toEqual([
      "/r/services/billing migrate",
      "/r/services/usage migrate",
    ]);
    expect(output()).toContain("billing: stackra db migrate --env dev exited 3");
  });

  it("refuses a database that is not on this machine, names it and never prints its connection string", async () => {
    const fake = tools(true, undefined, "billing");
    const { io, output } = captureIo();
    expect(await prepareDevData(plan("demo"), "/app", fake.tools, io)).toBe(1);
    expect(fake.runs.map((run) => `${run.cwd} ${run.args[1]}`)).toEqual([
      "/r/services/usage migrate",
    ]);
    expect(output()).toContain(
      "billing: database billing is not on this machine; the dev data step migrates and seeds local databases only",
    );
    expect(output()).not.toContain("db.example.com");
    expect(output()).not.toContain("migrated and seeded");
  });

  it("touches no database when the gateway never answers, and waits for nothing with nothing to do", async () => {
    const down = tools(false);
    const { io, output } = captureIo();
    expect(await prepareDevData(plan("demo"), "/app", down.tools, io, { timeoutMs: 10 })).toBe(1);
    expect(down.captured).toEqual([]);
    expect(output()).toContain("the gateway on port 4000 did not answer");

    const ended = new AbortController();
    ended.abort();
    const before = output();
    expect(
      await prepareDevData(plan("demo"), "/app", down.tools, io, { signal: ended.signal }),
    ).toBe(0);
    expect(output()).toBe(before);

    const idle = tools(true);
    const none: DevRootPlan = { ...plan(undefined), services: plan(undefined).services.slice(2) };
    expect(await prepareDevData(none, "/app", idle.tools, io)).toBe(0);
    expect(idle.waited).toEqual([]);
  });
});
