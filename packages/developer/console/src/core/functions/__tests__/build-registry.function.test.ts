/**
 * Stackra file contract:
 * Purpose: proves `buildRegistry` keys every command by its name and aliases and refuses a name claimed twice.
 * Boundary: unit test.
 * Runtime: node
 * Governing contract: STA-1730 spec FR-006 and FR-007; ADR 0022 (test placement).
 */
// @covers sta-1730:FR-006 sta-1730:FR-007
import { Command } from "#core/bases/command.base";
import { DuplicateCommandError } from "#core/errors/duplicate-command.error";
import { buildRegistry } from "#core/functions/build-registry.function";

class MigrateCommand extends Command({
  name: "db:migrate",
  description: "Migrate",
  aliases: ["migrate"],
}) {
  handle() {
    return 0;
  }
}

class OtherMigrateCommand extends Command({
  name: "migrate",
  description: "Another",
}) {
  handle() {
    return 0;
  }
}

describe("buildRegistry", () => {
  it("keys a command by its name and each alias", () => {
    const registry = buildRegistry([MigrateCommand, MigrateCommand]);
    expect([...registry.keys()]).toEqual(["db:migrate", "migrate"]);
    expect(registry.get("migrate")?.type).toBe(MigrateCommand);
  });

  it("refuses two classes that claim one name, naming both", () => {
    expect(() => buildRegistry([MigrateCommand, OtherMigrateCommand])).toThrow(
      DuplicateCommandError,
    );
    expect(() => buildRegistry([MigrateCommand, OtherMigrateCommand])).toThrow(
      /"migrate" is claimed by both MigrateCommand and OtherMigrateCommand/,
    );
  });
});
