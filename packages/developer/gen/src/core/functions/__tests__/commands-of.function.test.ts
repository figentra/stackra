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

/** An action class of the orders module that declares `command`. */
function action(options: Record<string, unknown>, input: string | null = "CancelOrderInput") {
  return {
    ...command("CancelOrderAction", options, "src/modules/orders/actions/cancel-order.action.ts"),
    kind: "action",
    importPath: "#modules/orders/actions/cancel-order.action",
    handle: input === null ? {} : { input },
  } satisfies DeclaredClass;
}

/** The input shape class of that action. */
const CANCEL_INPUT = {
  name: "CancelOrderInput",
  kind: "schema",
  module: "orders",
  file: "src/modules/orders/schemas/cancel-order-input.schema.ts",
  importPath: "#modules/orders/schemas/cancel-order-input.schema",
  fields: [],
} as unknown as MemberIR["shapes"][number];

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

  // @covers sta-1966:FR-022
  it("hosts a package's commands in a service only: an app keeps its own and gets none hosted", () => {
    const hostedPackage = [{ package: "@stackra/database", manifest: hosted([DB_STATUS]) }];
    const own = command("OpenCommand", { name: "open" }, "src/commands/open.command.ts", "web");
    const app = { ...service([own], hostedPackage), layout: "app" as const };
    expect(commandsOf(app).commands.map((row) => row["name"])).toEqual(["open"]);
    expect(commandsOf({ ...service([], hostedPackage), layout: "app" as const }).commands).toEqual(
      [],
    );
    expect(commandsOf(service([], hostedPackage)).commands.map((row) => row["name"])).toEqual([
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

describe("commandsOf for an action's `command` option", () => {
  // @covers sta-1966:FR-022
  it("adds a row for an action with a command name, naming the action and its input", () => {
    const row = commandsOf(service([action({ command: "order:cancel" })])).commands[0];
    expect(row).toMatchObject({
      name: "order:cancel",
      class: "CancelOrderActionCommand",
      action: "CancelOrderAction",
      input: "CancelOrderInput",
      module: "orders",
      bin: false,
    });
    expect(row?.["group"]).toBeUndefined();
  });

  it("takes the name and group of the object form, and skips an action with no command", () => {
    const rows = commandsOf(
      service([action({ command: { name: "order:cancel", group: "Orders" } }), PRUNE]),
    ).commands;
    expect(rows.map((item) => [item["name"], item["group"]])).toEqual([
      ["orders:prune", undefined],
      ["order:cancel", "Orders"],
    ]);
    expect(commandsOf(service([action({})])).commands).toEqual([]);
  });

  // @covers sta-1966:FR-022
  it("refuses an action with a command but no input shape class", () => {
    const { errors, commands } = commandsOf(service([action({ command: "order:cancel" }, null)]));
    expect(commands).toEqual([]);
    expect(errors.map((error) => [error.code, error.subject])).toEqual([
      ["command_input_missing", "CancelOrderAction"],
    ]);
    expect(errors[0]?.fix).toContain("Schema");
  });

  // @covers sta-1966:FR-022
  it("refuses a name that breaks the command-name rule", () => {
    const { errors } = commandsOf(service([action({ command: "Order Cancel" })]));
    expect(errors.map((error) => error.code)).toEqual(["command_name_invalid"]);
  });

  it("still collides with a hosted package's command by name", () => {
    const clash = { ...DB_STATUS, name: "order:cancel" };
    const { errors } = commandsOf(
      service(
        [action({ command: "order:cancel" })],
        [{ package: "@stackra/database", manifest: hosted([clash]) }],
      ),
    );
    expect(errors.map((error) => error.code)).toEqual(["command_collision"]);
    expect(errors[0]?.message).toContain("CancelOrderActionCommand");
  });

  // @covers sta-1966:FR-022
  it("emits the generated class beside the imports of the action and its input", () => {
    const ir = {
      ...service([action({ command: { name: "order:cancel", group: "Orders" } })]),
      shapes: [CANCEL_INPUT],
    };
    const text = emitCommands(ir, buildManifest(ir).manifest) ?? "";
    expect(text).toContain('import { ActionCommand } from "@stackra/actions/node";');
    expect(text).toContain(
      'import { CancelOrderAction } from "#modules/orders/actions/cancel-order.action";',
    );
    expect(text).toContain(
      'import { CancelOrderInput } from "#modules/orders/schemas/cancel-order-input.schema";',
    );
    expect(text).toContain(
      'export class CancelOrderActionCommand extends ActionCommand(CancelOrderAction, CancelOrderInput, { name: "order:cancel", group: "Orders" }) {}',
    );
    expect(text).toContain("export const COMMANDS = [CancelOrderActionCommand] as const;");
  });
});

describe("the console entry for action commands", () => {
  const paths = [".stackra/gen/commands.ts", ".stackra/gen/wiring.ts"];

  // @covers sta-1966:FR-022
  it("wraps the container only when the member has action commands", () => {
    const withAction = emitConsoleEntry(service([action({ command: "order:cancel" })]), paths);
    expect(withAction?.content).toContain(
      'import { ACTION_COMMANDS, COMMANDS } from "#stackra/commands";',
    );
    expect(withAction?.content).toContain("Reflect.construct(type, [container])");
    expect(withAction?.content).toContain("close: () => container.close()");
    const without = emitConsoleEntry(service([PRUNE]), paths);
    expect(without?.content).not.toContain("ACTION_COMMANDS");
    expect(without?.content).toContain(
      "container: async () => (await bootApp(wiring, { env: process.env })).container,",
    );
  });

  it("exports ACTION_COMMANDS from the commands file", () => {
    const ir = { ...service([action({ command: "order:cancel" })]), shapes: [CANCEL_INPUT] };
    expect(emitCommands(ir, buildManifest(ir).manifest)).toContain(
      "export const ACTION_COMMANDS: ReadonlySet<unknown> = new Set([CancelOrderActionCommand]);",
    );
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
