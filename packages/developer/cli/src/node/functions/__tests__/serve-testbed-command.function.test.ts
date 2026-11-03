/**
 * Stackra file contract:
 * Purpose: unit tests of `serveTestbedCommand`: the script's order (build, app, migrate, seed, serve, command last),
 *          the removal of Encore's Postgres container on exit, and the refusal of a surface that is not a key.
 * Boundary: test only; nothing starts a process.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0484; STA-1675.
 */
import { describe, expect, it } from "@stackra/testing";

import { CliUsageError } from "#node/errors/cli-usage.error";
import { serveTestbedCommand } from "#node/functions/serve-testbed-command.function";

describe("serveTestbedCommand", () => {
  it("builds, starts the app, seeds, serves, then runs the command last", () => {
    const lines = serveTestbedCommand("console", "pnpm exec playwright test").split("\n");
    const at = (text: string): number => lines.findIndex((line) => line.includes(text));
    expect(at("surfaces-only")).toBeLessThan(at("encore run"));
    expect(at("encore run")).toBeLessThan(at("encore db conn-uri"));
    // migrate, then seed, both against the app's database
    expect(at("encore db conn-uri")).toBeLessThan(at("export DATABASE_DIRECT_URL"));
    expect(at("export DATABASE_DIRECT_URL")).toBeLessThan(at("stackra db migrate"));
    expect(at("stackra db migrate")).toBeLessThan(at("seed-pack"));
    expect(at("seed-pack")).toBeLessThan(at("preview serve --surface console"));
    expect(at("preview serve")).toBeLessThan(at("STACKRA_E2E_BASE_URL=http://127.0.0.1:4173"));
    expect(lines.at(-1)).toBe("pnpm exec playwright test");
    expect(lines[0]).toBe("set -e");
    // the job image has no node_modules/.bin on PATH
    expect(
      lines.filter((line) => line.includes("stackra ") && !line.includes("pnpm exec stackra")),
    ).toEqual([]);
  });

  it("removes on exit the Encore Postgres containers that appeared while the app started", () => {
    const lines = serveTestbedCommand("console", "x").split("\n");
    const at = (text: string): number => lines.findIndex((line) => line.includes(text));
    expect(at("pg_before=$(docker ps")).toBeLessThan(at("encore run"));
    expect(lines.find((line) => line.startsWith("trap "))).toContain("docker rm -f $pg");
    expect(at("pg=$(docker ps")).toBeGreaterThan(at("until curl"));
    expect(at("pg=$(docker ps")).toBeLessThan(at("encore db conn-uri"));
  });

  it("refuses a surface that is not a key", () => {
    expect(() => serveTestbedCommand("console; rm -rf /", "x")).toThrow(CliUsageError);
  });
});
