/**
 * Stackra file contract:
 * Purpose: proves a passthrough command (migration only) gets every token after its name raw in `io.rest`, `-n` and
 *          `--json` included, while `--help` and `help <cmd>` still print usage without running it; that it may declare
 *          no field; and that `passthroughCommands` lists the commands still in that state.
 * Boundary: unit test through the in-process harness.
 * Runtime: node
 * Governing contract: STA-1966 (passthrough, leader 2026-11-02); ADR 0500 decision 7; ADR 0022 (test placement).
 */
import { Command } from "#core/bases/command.base";
import { Option } from "#core/decorators/option.decorator";
import { ConsoleDeclarationError } from "#core/errors/console-declaration.error";
import type { CommandIo } from "#core/types/command-io.type";
import { passthroughCommands } from "#testing/functions/passthrough-commands.function";
import { runCommandForTest } from "#testing/functions/run-command-for-test.function";

/** A ported command that still parses its own flags. */
class GateCommand extends Command({
  name: "gate",
  description: "Run a gate",
  passthrough: true,
}) {
  static seen: readonly string[] | undefined;

  handle(io: CommandIo) {
    GateCommand.seen = io.rest;
    io.output.line(`gate ${io.rest.join(" ")}`);
  }
}

/** A converted command. */
class StatusCommand extends Command({
  name: "status",
  description: "Show the status",
}) {
  handle() {
    return 0;
  }
}

const COMMANDS = [GateCommand, StatusCommand];

describe("a passthrough command", () => {
  it("gets every token after its name raw", async () => {
    const result = await runCommandForTest(COMMANDS, [
      "gate",
      "dir",
      "--slug",
      "x",
      "-n",
      "--json",
      "--",
      "-v",
    ]);
    expect(result.exitCode).toBe(0);
    expect(GateCommand.seen).toEqual(["dir", "--slug", "x", "-n", "--json", "--", "-v"]);
    expect(result.stdout).toContain("gate dir --slug x -n --json -- -v");
  });

  it("prints usage for --help and help <cmd> without running", async () => {
    GateCommand.seen = undefined;
    for (const argv of [
      ["gate", "--help"],
      ["gate", "-h"],
      ["help", "gate"],
    ]) {
      const result = await runCommandForTest(COMMANDS, argv);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("app gate [options] [arguments...]");
    }
    expect(GateCommand.seen).toBeUndefined();
  });

  it("declares no field", async () => {
    /** A passthrough command with a field. */
    class WrongCommand extends Command({
      name: "wrong",
      description: "Wrong",
      passthrough: true,
    }) {
      @Option
      force = false;

      handle() {
        return 0;
      }
    }
    await expect(runCommandForTest([WrongCommand], ["wrong"])).rejects.toThrow(
      ConsoleDeclarationError,
    );
  });

  it("is listed until it is converted", () => {
    expect(passthroughCommands(COMMANDS)).toEqual(["gate"]);
  });
});
