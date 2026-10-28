/**
 * Stackra file contract:
 * Purpose: unit tests of `Macro`: a bare kind base registered as `macro`, whose subclass's `apply` writes columns on
 *          the blueprint it is given and returns them as a group.
 * Boundary: test only; the blueprint is the compiler's, reached through `compileMigration`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0159 as amended by ADR 0305 (macros); ADR 0022; ADR 0269.
 */
import { kindOf } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import { Macro } from "#core/bases/macro.base";
import { Migration } from "#core/bases/migration.base";
import { compileMigration } from "#core/functions/compile-migration.function";
import type { Blueprint } from "#core/types/blueprint.type";
import type { ColumnGroup } from "#core/types/column-group.type";
import type { SchemaBuilder } from "#core/types/schema-builder.type";

class ScoreMacro extends Macro {
  apply(t: Blueprint, column: string): ColumnGroup {
    return t.group(t.integer(column).default(0));
  }
}

describe("Macro", () => {
  it("is a kind base whose subclasses become blueprint methods", () => {
    class AddScoreMigration extends Migration {
      up(schema: SchemaBuilder): void {
        schema.table("players", (t) => {
          (t as Blueprint & { score: (column: string) => ColumnGroup })
            .score("rating")
            .notNull()
            .comment("The rating.");
        });
      }
    }
    expect(kindOf(ScoreMacro)?.kind).toBe("macro");
    const [step] = compileMigration(AddScoreMigration, {
      schema: "games",
      macros: [ScoreMacro],
    }).steps;
    expect(step?.sql[0]).toBe(
      'alter table "games"."players" add column "rating" integer default 0 not null',
    );
  });
});
