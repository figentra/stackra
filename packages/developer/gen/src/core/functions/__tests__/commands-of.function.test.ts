/**
 * Stackra file contract:
 * Purpose: unit tests of `commandsOf`, `emitCommands`, `emitConsoleEntry` and the `commands` section of
 *          `buildManifest`: a command's manifest row, the `kind_path` refusal outside its group, the merge of a hosted
 *          package's rows marked `from` (never a `bin` row), `command_collision` naming both classes, and the exact
 *          `#stackra/commands` and console entry text for a small service.
 * Boundary: test only; runs on hand-built service and package IRs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0506 (decisions 4 and 6); STA-1731 spec SC-001.
 */
import type { StackraManifest } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { buildManifest } from "#core/functions/build-manifest.function";
import { commandsOf } from "#core/functions/commands-of.function";
import { emitCommands } from "#core/functions/emit-commands.function";
import { emitConsoleEntry } from "#core/functions/emit-console-entry.function";
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { MemberIR } from "#core/types/member-ir.type";

const FILE = "src/modules/orders/commands/orders-prune.command.ts";

/** A command class of the orders module. */
function command(
  name: string,
  options: Record<string, unknown>,
  file = FILE,
  module = "orders",
): DeclaredClass {
  return {
    name,
    kind: "command",
    module,
    file,
    importPath: `#modules/${module}/commands/${(file.split("/").pop() ?? "").replace(/\.ts$/, "")}`,
    options,
    deps: [],
    facets: [],
    methods: ["handle"],
    refusals: [],
    statics: {},
    traits: [],
  };
}

/** A hosted package's committed manifest with `commands`. */
function hosted(commands: NonNullable<StackraManifest["commands"]>): StackraManifest {
  return { member: "database", package: "@stackra/database", version: "1.0.0", commands };
}

/** The orders service with the given commands and hosted packages. */
function service(
  classes: readonly DeclaredClass[],
  dependencies: MemberIR["dependencies"] = [],
): MemberIR {
  return {
    member: "orders",
    package: "@figentra/service-orders",
    version: "1.0.0",
    layout: "service",
    modules: ["orders"],
    classes,
    shapes: [],
    enums: [],
    files: [],
    dependencies,
    errors: [],
  };
}

const PRUNE = command("OrdersPruneCommand", {
  name: "orders:prune",
  description: "Prune",
  aliases: ["prune"],
  audit: true,
});

const DB_STATUS = {
  name: "db:status",
  aliases: [],
  hidden: false,
  audit: true,
  bin: false,
  class: "DbStatusCommand",
  file: "src/node/commands/db-status.command.ts",
  entry: "node",
};

describe("commandsOf", () => {
  // @covers sta-1731:FR-002
  it("records one row per command with its options, entry and module", () => {
    expect(commandsOf(service([PRUNE]))).toEqual({
      commands: [
        {
          name: "orders:prune",
          aliases: ["prune"],
          hidden: false,
          audit: true,
          bin: false,
          class: "OrdersPruneCommand",
          file: FILE,
          entry: "index",
          module: "orders",
        },
      ],
      errors: [],
    });
  });

  // @covers sta-1731:FR-001
  it("refuses a command outside its group with kind_path naming the file", () => {
    const stray = command(
      "StrayCommand",
      { name: "stray" },
      "src/modules/orders/services/stray.command.ts",
    );
    const { errors } = commandsOf(service([stray]));
    expect(errors.map((error) => [error.code, error.file])).toEqual([
      ["kind_path", "src/modules/orders/services/stray.command.ts"],
    ]);
  });

  // @covers sta-1731:FR-001
  it("accepts a package's src/node/commands and an app's src/commands, and refuses the other way round", () => {
    const own = command("DbStatusCommand", { name: "db:status" }, DB_STATUS.file, "database");
    expect(commandsOf({ ...service([own]), layout: "package" }).errors).toEqual([]);
    expect(commandsOf(service([own])).errors.map((error) => error.code)).toEqual(["kind_path"]);
    const app = command("OpenCommand", { name: "open" }, "src/commands/open.command.ts", "web");
    expect(commandsOf({ ...service([app]), layout: "app" }).errors).toEqual([]);
  });

  it("refuses a command with no written name", () => {
    expect(
      commandsOf(service([command("NamelessCommand", {})])).errors.map((error) => error.code),
    ).toEqual(["identity_missing"]);
  });

  // @covers sta-1731:FR-003
  it("merges a hosted package's rows after the own ones, marked from, and skips a bin row", () => {
    const ir = service(
      [PRUNE],
      [
        {
          package: "@stackra/database",
          manifest: hosted([DB_STATUS, { ...DB_STATUS, name: "create", bin: true }]),
        },
      ],
    );
    expect(commandsOf(ir).commands.map((row) => [row["name"], row["from"]])).toEqual([
      ["orders:prune", undefined],
      ["db:status", "@stackra/database"],
    ]);
  });

  it("hosts no command from a devDependency, whose tooling the member's console does not have", () => {
    const ir = {
      ...service(
        [PRUNE],
        [
          { package: "@stackra/database", manifest: hosted([DB_STATUS]) },
          { package: "@acme/dev-tools", manifest: hosted([{ ...DB_STATUS, name: "tools:lint" }]) },
        ],
      ),
      runtimePackages: ["@stackra/database"],
    };
    expect(commandsOf(ir).commands.map((row) => row["name"])).toEqual([
      "orders:prune",
      "db:status",
    ]);
  });

  // @covers sta-1731:FR-005
  it("fails with command_collision naming both classes when a name or alias repeats", () => {
    const clash = command(
      "OtherCommand",
      { name: "other", aliases: ["db:status"] },
      "src/modules/orders/commands/other.command.ts",
    );
    const { errors } = commandsOf(
      service([clash], [{ package: "@stackra/database", manifest: hosted([DB_STATUS]) }]),
    );
    expect(errors).toHaveLength(1);
    expect(errors[0]?.code).toBe("command_collision");
    expect(errors[0]?.message).toContain("OtherCommand");
    expect(errors[0]?.message).toContain("DbStatusCommand");
    expect(errors[0]?.message).toContain("@stackra/database");
  });
});

describe("buildManifest commands", () => {
  it("writes `commands` only when there is a row", () => {
    expect(buildManifest(service([])).manifest.commands).toBeUndefined();
    expect(buildManifest(service([PRUNE])).manifest.commands?.map((row) => row.name)).toEqual([
      "orders:prune",
    ]);
  });
});

describe("emitCommands and emitConsoleEntry", () => {
  const ir = service([PRUNE], [{ package: "@stackra/database", manifest: hosted([DB_STATUS]) }]);
  const { manifest } = buildManifest(ir);

  // @covers sta-1731:FR-006
  it("lists every row as a static import and exports COMMANDS in manifest order", () => {
    const text = emitCommands(ir, manifest) ?? "";
    expect(text).toContain(
      'import { OrdersPruneCommand } from "#modules/orders/commands/orders-prune.command";',
    );
    expect(text).toContain('import { DbStatusCommand } from "@stackra/database/node";');
    expect(text).toContain(
      "export const COMMANDS = [OrdersPruneCommand, DbStatusCommand] as const;",
    );
  });

  // @covers sta-1731:FR-006
  it("writes no file for a member with no commands", () => {
    const empty = service([]);
    expect(emitCommands(empty, buildManifest(empty).manifest)).toBeUndefined();
  });

  // @covers sta-1731:FR-008 sta-1731:FR-010
  it("writes the console entry with a container factory, and none without commands or for a package", () => {
    const paths = [
      ".stackra/gen/commands.ts",
      ".stackra/gen/wiring.ts",
      ".stackra/gen/registrations.ts",
    ];
    const entry = emitConsoleEntry(ir, paths);
    expect(entry?.path).toBe(".stackra/entry/console.ts");
    const body = (entry?.content ?? "")
      .split("\n")
      .filter((line) => !line.startsWith(" *") && line !== "/**" && line !== " */");
    expect(body.join("\n")).toBe(
      [
        'import "#stackra/registrations";',
        'import { bootApp } from "@stackra/app";',
        'import { createConsole } from "@stackra/console";',
        'import { nodePorts } from "@stackra/console/node";',
        'import { COMMANDS } from "#stackra/commands";',
        'import { wiring } from "#stackra/wiring";',
        "",
        "const app = createConsole({",
        '  name: "orders",',
        '  version: "1.0.0",',
        "  commands: COMMANDS,",
        "  container: async () => (await bootApp(wiring, { env: process.env })).container,",
        "});",
        "",
        "/** Runs the console with `argv`, the arguments after the member; resolves to the command's exit code. */",
        "export const run = (argv: readonly string[]): Promise<number> => app.run(argv, nodePorts());",
        "",
      ].join("\n"),
    );
    expect(emitConsoleEntry(ir, [])).toBeUndefined();
    expect(emitConsoleEntry({ ...ir, layout: "package" }, paths)).toBeUndefined();
  });
});
