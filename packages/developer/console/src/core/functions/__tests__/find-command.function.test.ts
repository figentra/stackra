/**
 * Stackra file contract:
 * Purpose: proves `findCommand` finds an exact name, a unique abbreviation by segment, and reports an ambiguous or
 *          unknown name with suggestions within edit distance 2.
 * Boundary: unit test.
 * Runtime: node
 * Governing contract: STA-1730 spec FR-011; ADR 0022 (test placement).
 */
// @covers sta-1730:FR-011
import { Command } from "#core/bases/command.base";
import { UsageError } from "#core/errors/usage.error";
import { buildRegistry } from "#core/functions/build-registry.function";
import { findCommand } from "#core/functions/find-command.function";

const make = (name: string) =>
  class extends Command({
    name,
    description: name,
  }) {
    handle() {
      return 0;
    }
  };

const registry = buildRegistry([
  make("tenant:seed"),
  make("tenant:sync"),
  make("test"),
  make("db:migrate"),
]);

describe("findCommand", () => {
  it("finds an exact name", () => {
    expect(findCommand("test", registry).structure.name).toBe("test");
  });

  it("finds a unique abbreviation by segment", () => {
    expect(findCommand("d:m", registry).structure.name).toBe("db:migrate");
    expect(findCommand("t:se", registry).structure.name).toBe("tenant:seed");
  });

  it("reports an ambiguous abbreviation with the matches", () => {
    expect(() => findCommand("t:s", registry)).toThrow(/ambiguous/);
  });

  it("reports an unknown name with suggestions", () => {
    try {
      findCommand("tset", registry);
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(UsageError);
      expect((error as UsageError).hint).toBe("Did you mean test?");
    }
  });
});
