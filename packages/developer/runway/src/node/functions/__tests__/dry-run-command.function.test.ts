/**
 * Stackra file contract:
 * Purpose: unit tests of `dryRunCommand` and `DryRunEdgeKvDriver`: the runner records every command with its folder
 *          and answers git, eas and anything else with stand-ins unless `answer` answers first; the KV driver keeps
 *          the rows and records each call.
 * Boundary: test only; runs nothing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0481 (dry runs).
 */
import { describe, expect, it } from "@stackra/testing";

import { DryRunEdgeKvDriver } from "#node/drivers/dry-run-edge-kv.driver";
import { dryRunCommand } from "#node/functions/dry-run-command.function";

describe("dryRunCommand", () => {
  it("records each command and answers with stand-ins", async () => {
    const run = dryRunCommand({
      head: "a".repeat(40),
      answer: (command) => (command === "npm" ? '"3.0.0"' : undefined),
    });
    expect(await run("git", ["rev-parse", "HEAD"], { cwd: "/t" })).toBe(`${"a".repeat(40)}\n`);
    expect(await run("eas", ["build"], {})).toBe("[]");
    expect(await run("npm", ["view"], {})).toBe('"3.0.0"');
    expect(await run("wrangler", ["kv"], {})).toBe("");
    expect(run.calls).toEqual([
      { command: "git", args: ["rev-parse", "HEAD"], cwd: "/t" },
      { command: "eas", args: ["build"] },
      { command: "npm", args: ["view"] },
      { command: "wrangler", args: ["kv"] },
    ]);
  });
});

describe("DryRunEdgeKvDriver", () => {
  it("keeps the rows and records each call", async () => {
    const kv = new DryRunEdgeKvDriver();
    await kv.put("host:a.example", '{"surface":"console"}');
    await kv.put("release:a:console", "{}");
    await kv.delete("release:a:console");
    expect(kv.json("host:a.example")).toEqual({ surface: "console" });
    expect([...kv.rows.keys()]).toEqual(["host:a.example"]);
    expect(kv.calls.map((call) => call[0])).toEqual(["put", "put", "delete"]);
  });
});
