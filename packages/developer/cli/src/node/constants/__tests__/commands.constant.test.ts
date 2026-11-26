/**
 * Stackra file contract:
 * Purpose: unit tests of `COMMANDS`: names are unique and cover what the template's scripts call today (and the
 *          registry item commands add and publish, ADR 0453), no
 *          Figentra-internal operation is present, every command has help text, every command sits under one of the
 *          `COMMAND_GROUPS` headings (the repository checks under Repository), the hidden ones are exactly the check
 *          presets and the commands a script or agent client runs, and every `COMMAND_FITS` key is a command.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decisions 3 and 4 and the packed-tarball enforcement);
 *                     STA-2872 spec FR-001 and FR-002.
 */
import { readCommand } from "@stackra/console";
import { describe, expect, it } from "@stackra/testing";

import { COMMAND_FITS } from "#node/constants/command-fits.constant";
import { COMMAND_GROUPS } from "#node/constants/command-groups.constant";
import { COMMANDS } from "#node/constants/commands.constant";
import { legacyCommand } from "#node/functions/legacy-command.function";

/** A command class's own name, or a legacy command's words joined with `:` as the console names them. */
const names = COMMANDS.map((command) =>
  typeof command === "function" ? readCommand(command).name : command.name.replaceAll(" ", ":"),
);

/** Every command as the console reads it: name, group and hidden flag. */
const structures = COMMANDS.map((command) =>
  readCommand(
    typeof command === "function" ? command : legacyCommand(command, async () => 0, false),
  ),
);

/** The names under `group`, sorted. */
const namesIn = (group: string) =>
  structures
    .filter((structure) => structure.group === group)
    .map((structure) => structure.name)
    .toSorted();

describe("COMMANDS", () => {
  // @covers sta-2872:FR-001
  it("puts every command under one of the list's headings", () => {
    for (const structure of structures)
      expect(COMMAND_GROUPS as readonly (string | undefined)[], structure.name).toContain(
        structure.group,
      );
  });

  // @covers sta-2872:FR-002
  it("puts the core repository's own checks under Repository", () => {
    expect(namesIn("Repository")).toEqual(
      [
        "any-ratchet",
        "app-native-deps",
        "architecture-map",
        "catalogue-completeness",
        "constitution",
        "consumer-gate",
        "cycles",
        "doc-standard",
        "duplicate-exports",
        "duplication",
        "eas-preflight",
        "row-security-declarations",
        "skill-licences",
        "structure",
        "testbed",
      ].toSorted(),
    );
  });

  // @covers sta-2872:FR-002
  it("hides only the check presets and the commands a script or agent client runs", () => {
    expect(
      structures
        .filter((structure) => structure.hidden)
        .map((structure) => structure.name)
        .toSorted(),
    ).toEqual(
      [
        "agents:check",
        "agents:sync",
        "code:check",
        "code:fix",
        "mcp",
        "mcp:exec",
        "mcp:sync",
        "validate",
        "verify",
      ].toSorted(),
    );
  });

  // @covers sta-2872:FR-002
  it("keys COMMAND_FITS by real commands outside the Repository group", () => {
    for (const name of Object.keys(COMMAND_FITS)) {
      const found = structures.find((structure) => structure.name === name);
      expect(found, name).toBeDefined();
      expect(found?.group).not.toBe("Repository");
    }
  });

  it("has unique names, each with a summary and a usage that starts with its name", () => {
    expect(new Set(names).size).toBe(names.length);
    for (const command of COMMANDS) {
      if (typeof command === "function") continue;
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
      "mcp:sync",
    ]) {
      expect(names).toContain(name);
    }
    expect(names).toEqual(
      expect.arrayContaining([
        "mcp:exec",
        "agents:sync",
        "agents:check",
        "db:migrate",
        "db:rollback",
        "db:seed",
        "db:diff",
        "new",
        "seed-pack",
        "settings:diff",
        "settings:apply",
        "search:reindex",
        "search:status",
        "audit:verify",
        "ops:bootstrap-operator",
        "smoke",
        "promote",
        "add",
        "publish",
        "testbed",
        "consumer-gate",
      ]),
    );
  });

  it("covers the repository commands moved from tools/scripts", () => {
    expect(names).toEqual(
      expect.arrayContaining([
        "doctor",
        "eas-preflight",
        "structure",
        "architecture-map",
        "doc-standard",
        "catalogue-completeness",
        "cycles",
        "app-native-deps",
        "duplicate-exports",
        "any-ratchet",
        "row-security-declarations",
        "duplication",
        "skill-licences",
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
      expect(names.some((name) => name.split(":")[0] === internal)).toBe(false);
    }
  });
});
