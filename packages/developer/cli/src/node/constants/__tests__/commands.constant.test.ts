/**
 * Stackra file contract:
 * Purpose: unit tests of `COMMANDS`: names are unique and cover what the template's scripts call today, no
 *          Figentra-internal operation is present, and every command has help text.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decisions 3 and 4 and the packed-tarball enforcement).
 */
import { describe, expect, it } from "@stackra/testing";

import { COMMANDS } from "#node/constants/commands.constant";

const names = COMMANDS.map((command) => command.name);

describe("COMMANDS", () => {
  it("has unique names, each with a summary and a usage that starts with its name", () => {
    expect(new Set(names).size).toBe(names.length);
    for (const command of COMMANDS) {
      expect(command.summary.length).toBeGreaterThan(0);
      expect(command.usage.startsWith(`stackra ${command.name}`)).toBe(true);
    }
  });

  it("covers the template's gen, member tool, mcp and agents scripts", () => {
    for (const name of [
      "gen",
      "dev",
      "build",
      "start",
      "typecheck",
      "test",
      "lint",
      "ls",
      "mcp",
      "mcp sync",
    ]) {
      expect(names).toContain(name);
    }
    expect(names).toEqual(
      expect.arrayContaining([
        "mcp exec",
        "agents sync",
        "agents check",
        "db migrate",
        "db rollback",
        "new",
        "seed-pack",
        "settings:diff",
        "settings:apply",
        "audit:verify",
      ]),
    );
  });

  it("registers check and the check aliases products already call (validate, verify, code:check, code:fix)", () => {
    expect(names).toEqual(
      expect.arrayContaining(["check", "validate", "verify", "code:check", "code:fix"]),
    );
  });

  it("holds no Figentra-internal operation", () => {
    for (const internal of ["linear", "bot", "merge", "secrets", "delegate", "spend"]) {
      expect(names.some((name) => name.split(" ")[0] === internal)).toBe(false);
    }
  });
});
