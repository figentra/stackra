/**
 * Stackra file contract:
 * Purpose: proves `Command({ ... })` records its options for `kindOf` without constructing, and refuses a bad name,
 *          a bad alias and an empty description.
 * Boundary: unit test of the kind base only.
 * Runtime: node
 * Governing contract: STA-1730 spec FR-001 and FR-005; ADR 0022 (test placement).
 */
// @covers sta-1730:FR-001 sta-1730:FR-005
import { kindOf } from "@stackra/container";

import { Command } from "#core/bases/command.base";
import { ConsoleDeclarationError } from "#core/errors/console-declaration.error";

describe("Command", () => {
  it("records its options as the command kind, with defaults", () => {
    class SeedCommand extends Command({
      name: "tenant:seed",
      description: "Seed a tenant",
    }) {
      handle() {
        return 0;
      }
    }
    expect(kindOf(SeedCommand)).toEqual({
      kind: "command",
      options: {
        name: "tenant:seed",
        description: "Seed a tenant",
        hidden: false,
        aliases: [],
        audit: false,
        bin: false,
        passthrough: false,
        examples: [],
      },
    });
  });

  it.each(["Tenant:seed", "tenant::seed", "tenant seed", "-seed", ""])(
    "refuses the name %j",
    (name) => {
      expect(() => Command({ name, description: "x" })).toThrow(ConsoleDeclarationError);
    },
  );

  it("refuses a bad alias", () => {
    expect(() => Command({ name: "seed", description: "x", aliases: ["Seed"] })).toThrow(/"Seed"/);
  });

  it("refuses an empty description", () => {
    expect(() => Command({ name: "seed", description: " " })).toThrow(/description/);
  });
});
