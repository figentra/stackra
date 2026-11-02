/**
 * Stackra file contract:
 * Purpose: proves `route` decides one intent per invocation: the list, the version, a command's help by `--help`,
 *          `-h` and `help <cmd>` (never a run), a run with its values, spaced names joined longest first, and a usage
 *          problem for an unknown name or a bad argument; and that the registry refuses a command named `help`.
 * Boundary: unit test; pure functions, no console run.
 * Runtime: node
 * Governing contract: STA-1966 spec FR-012 to FR-016, AC-002 and AC-003; ADR 0022 (test placement).
 */
// @covers sta-1966:FR-012 sta-1966:FR-013 sta-1966:FR-014 sta-1966:FR-015 sta-1966:FR-016
// @covers sta-1966:AC-002 sta-1966:AC-003
import { Command } from "#core/bases/command.base";
import { Argument } from "#core/decorators/argument.decorator";
import { ConsoleDeclarationError } from "#core/errors/console-declaration.error";
import { buildRegistry } from "#core/functions/build-registry.function";
import { route } from "#core/functions/route.function";

const make = (name: string) =>
  class extends Command({
    name,
    description: name,
  }) {
    handle() {
      return 0;
    }
  };

/** A command with a required argument, so `help seed` must not need it. */
class SeedCommand extends Command({
  name: "seed",
  description: "Seed",
}) {
  @Argument
  account!: string;

  handle() {
    return 0;
  }
}

const registry = buildRegistry([make("status"), make("mcp"), make("mcp:sync"), SeedCommand]);

describe("route", () => {
  it.each([[[]], [["help"]], [["--help"]], [["-v"]]])("lists for %j", (argv) => {
    expect(route(argv, registry).kind).toBe("list");
  });

  it.each([[["--version"]], [["-V"]], [["status", "--version"]]])("versions for %j", (argv) => {
    expect(route(argv, registry).kind).toBe("version");
  });

  it.each([
    [["status", "--help"], "status"],
    [["status", "-h"], "status"],
    [["help", "status"], "status"],
    [["help", "mcp", "sync"], "mcp:sync"],
    [["help", "seed"], "seed"],
    [["seed", "--help"], "seed"],
  ])("helps for %j without running", (argv, name) => {
    const intent = route(argv, registry);
    expect(intent.kind).toBe("help");
    expect(intent.kind === "help" && intent.entry.structure.name).toBe(name);
  });

  it("joins spaced names into the longest registered name", () => {
    const sync = route(["mcp", "sync", "--json"], registry);
    expect(sync.kind === "run" && sync.entry.structure.name).toBe("mcp:sync");
    expect(sync.globals.json).toBe(true);
    const mcp = route(["mcp"], registry);
    expect(mcp.kind === "run" && mcp.entry.structure.name).toBe("mcp");
  });

  it("runs with the parsed values", () => {
    const intent = route(["seed", "acme"], registry);
    expect(intent).toMatchObject({ kind: "run", values: { account: "acme" } });
  });

  it.each([[["stauts"]], [["help", "stauts"]]])(
    "reports an unknown name with the closest one for %j",
    (argv) => {
      const intent = route(argv, registry);
      expect(intent.kind).toBe("usage");
      expect(intent.kind === "usage" && intent.error.hint).toBe("Did you mean status?");
    },
  );

  it("reports a missing argument when the command would run", () => {
    expect(route(["seed"], registry).kind).toBe("usage");
  });

  it("refuses a command named help", () => {
    expect(() => buildRegistry([make("help")])).toThrow(ConsoleDeclarationError);
  });
});
