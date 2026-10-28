/**
 * Stackra file contract:
 * Purpose: unit tests of `statementShape`: literals and placeholders become `?`, lists collapse to one `(?)`, the verb
 *          and table are read, and identifiers with digits are kept.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); data-layer gaps scale-performance 7 and 8 (STA-1400).
 */
import { describe, expect, it } from "@stackra/testing";

import { statementShape } from "#core/functions/statement-shape.function";

describe("statementShape", () => {
  it("drops every value and collapses lists", () => {
    expect(
      statementShape(
        `select "o0".* from "public"."orders" as "o0"\n  where "o0"."id" in ($1, $2, $3) and "o0"."note" = 'it''s' and total > 10.5`,
      ),
    ).toEqual({
      statement: `select "o0".* from "public"."orders" as "o0" where "o0"."id" in (?) and "o0"."note" = ? and total > ?`,
      verb: "select",
      table: "public.orders",
    });
  });

  it("gives one shape to inserts of any row count", () => {
    const one = statementShape(`insert into "lines" ("a", "b") values ($1, $2)`);
    const three = statementShape(
      `insert into "lines" ("a", "b") values ($1, $2), ($3, $4), ($5, $6)`,
    );
    expect(three.statement).toBe(one.statement);
    expect(one).toMatchObject({ verb: "insert", table: "lines" });
  });

  it("reads an update and a statement without a table", () => {
    expect(statementShape("update orders set paid = true where id = ?")).toMatchObject({
      verb: "update",
      table: "orders",
    });
    expect(statementShape("begin")).toEqual({ statement: "begin", verb: "begin" });
  });
});
