/**
 * Stackra file contract:
 * Purpose: unit tests of `COMMANDS`: names are unique and cover what the template's scripts call today (and the
 *          registry item commands add and publish, ADR 0453), no
 *          Figentra-internal operation is present, every command has help text, every command sits under one of the
 *          `COMMAND_GROUPS` headings (the repository checks under Repository), the hidden ones are exactly the check
 *          presets and the commands a script or agent client runs, and every `COMMAND_FITS` key is a command. Each
 *          ported command (a class with a `body`) declares every option its body reads as a described field, and a
 *          run with every field given hands each of them to the body.
 * Boundary: test only; the bodies are stubbed, so no command runs a tool.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decisions 3 and 4 and the packed-tarball enforcement);
 *                     STA-2872 spec FR-001 and FR-002; STA-2883 spec FR-001 and FR-002.
 */
import { readCommand } from "@stackra/console";
import type { CommandField } from "@stackra/console/contracts";
import { runCommandForTest } from "@stackra/console/testing";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { COMMAND_FITS } from "#node/constants/command-fits.constant";
import { COMMAND_GROUPS } from "#node/constants/command-groups.constant";
import { COMMANDS } from "#node/constants/commands.constant";
import type { CliCommand } from "#node/types/cli-command.type";

/** Every command as the console reads it: name, group, hidden flag and fields. */
const structures = COMMANDS.map((command) => readCommand(command));

/** Each command's name (`mcp:sync` for `stackra mcp sync`). */
const names = structures.map((structure) => structure.name);

/** The commands ported from a passthrough body (STA-2883): the class and the body it runs. */
const ported = COMMANDS.flatMap((command) => {
  const body = (command as { readonly body?: CliCommand }).body;
  return body === undefined ? [] : [{ command, body, structure: readCommand(command) }];
});

/** The tokens that give `field` a value its checks accept. */
function tokensFor(field: CommandField): string[] {
  const value = field.choices?.[0] ?? (field.kind === "string" ? "x" : "1");
  if (field.role === "argument") return [value];
  if (field.kind !== "boolean") return [`--${field.flag}`, value];
  // A flag on by default is given by its negation (`--no-wait`), as a person turns it off.
  return [field.default === true ? `--no-${field.flag}` : `--${field.flag}`];
}

/** The body options `field` answers: its flag, or `no-<flag>` for a flag on by default. */
const answers = (field: CommandField) =>
  field.kind === "boolean" && field.default === true ? `no-${field.flag}` : field.flag;

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
        "architecture-map",
        "catalogue-completeness",
        "constitution",
        "consumer-gate",
        "cycles",
        "doc-standard",
        "duplicate-exports",
        "duplication",
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
  it("puts the mobile build checks where an app team with a mobile app sees them", () => {
    expect(structures.find((structure) => structure.name === "eas-preflight")?.group).toBe(
      "Deploy",
    );
    expect(structures.find((structure) => structure.name === "app-native-deps")?.group).toBe(
      "Quality",
    );
    expect(COMMAND_FITS["eas-preflight"]).toBe("mobile");
    expect(COMMAND_FITS["app-native-deps"]).toBe("mobile");
  });

  // @covers sta-2872:FR-002
  it("keys COMMAND_FITS by real commands outside the Repository group", () => {
    for (const name of Object.keys(COMMAND_FITS)) {
      const found = structures.find((structure) => structure.name === name);
      expect(found, name).toBeDefined();
      expect(found?.group).not.toBe("Repository");
    }
  });

  it("has unique names, each with a description", () => {
    expect(new Set(names).size).toBe(names.length);
    for (const structure of structures)
      expect(structure.description.length, structure.name).toBeGreaterThan(0);
  });

  // @covers sta-2883:FR-001
  it("ports the day-one commands from their passthrough bodies, each usage naming the command", () => {
    expect(ported.map(({ structure }) => structure.name).toSorted()).toEqual(
      [
        "build",
        "check",
        "code:check",
        "code:fix",
        "console",
        "db:diff",
        "db:seed",
        "deploy",
        "dev",
        "eas-preflight",
        "gen",
        "lint",
        "mcp",
        "mcp:exec",
        "new",
        "preview:serve",
        "seed-pack",
        "start",
        "test",
        "testbed",
        "typecheck",
        "validate",
        "verify",
      ].toSorted(),
    );
    for (const { body, structure } of ported) {
      expect(body.name.replaceAll(" ", ":"), structure.name).toBe(structure.name);
      expect(body.usage.startsWith(`stackra ${body.name}`), structure.name).toBe(true);
    }
  });

  // @covers sta-2883:FR-002
  it("declares every option a body reads as a described field of its command", () => {
    for (const { body, structure } of ported) {
      const fields = [...structure.arguments, ...structure.options];
      for (const field of fields)
        expect(field.description ?? "", `${structure.name} ${field.flag}`).not.toBe("");
      const declared = new Set(structure.options.map(answers));
      for (const option of Object.keys(body.options ?? {}))
        // `json` is the console's own --json, which the class hands on (`testbed`).
        if (option !== "json") expect(declared, `${structure.name} --${option}`).toContain(option);
    }
  });

  // @covers sta-2883:FR-001
  it("hands every option and argument the line gives to the body", async () => {
    for (const { command, body, structure } of ported) {
      const run = vi.spyOn(body, "run").mockResolvedValue(0);
      const argv = [
        structure.name,
        ...structure.arguments.flatMap(tokensFor),
        ...structure.options.flatMap(tokensFor),
      ];
      const result = await runCommandForTest([command], argv, { cwd: "/work" });
      expect(`${result.exitCode} ${result.stderr}`, argv.join(" ")).toBe("0 ");
      const context = run.mock.calls[0]?.[0];
      run.mockRestore();
      expect(context, argv.join(" ")).toBeDefined();
      for (const option of Object.keys(body.options ?? {}))
        if (option !== "json")
          expect(context?.values[option], `${structure.name} --${option}`).toBeDefined();
      const given = structure.arguments.flatMap(tokensFor);
      expect([...(context?.positionals ?? []), ...(context?.rest ?? [])], structure.name).toEqual(
        given,
      );
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

  // @covers sta-2883:FR-001
  it("describes --os of dev and build as a template checkout, with no Figentra names in their help", () => {
    for (const name of ["dev", "build"]) {
      const structure = structures.find((found) => found.name === name);
      const os = structure?.options.find((option) => option.property === "os");
      expect(os?.description, name).toMatch(/template checkout/);
      const help = [
        structure?.description ?? "",
        ...(structure?.examples ?? []),
        ...(structure?.options ?? []).map((option) => option.description ?? ""),
      ].join("\n");
      expect(help, name).not.toMatch(/figentra/i);
    }
  });

  it("holds no Figentra-internal operation", () => {
    for (const internal of ["linear", "bot", "merge", "secrets", "delegate", "spend"]) {
      expect(names.some((name) => name.split(":")[0] === internal)).toBe(false);
    }
  });
});
