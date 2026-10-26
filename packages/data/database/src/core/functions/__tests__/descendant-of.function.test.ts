/**
 * Stackra file contract:
 * Purpose: unit tests of `descendantOf`: the column's `<@` against the path as one `ltree` parameter, and a refusal of a path
 *          that is not an `ltree` path.
 * Boundary: test only; inspects the MikroORM fragment, runs no query (the Postgres integration test runs it).
 * Runtime: node (vitest)
 * Governing contract: ADR 0160 (decision 1); ADR 0327 (decision 3); ADR 0022; ADR 0269.
 */
import { describe, expect, it } from "@stackra/testing";

import { descendantOf } from "#core/functions/descendant-of.function";
import { table } from "#core/functions/table.function";

const Connections = table("integrations.connections", { scopePath: "scope_path" });

describe(descendantOf, () => {
  it("binds the path as one ltree parameter", () => {
    const fragment = descendantOf(Connections.columns.scopePath, "platform.acme");
    expect(fragment.sql).toBe('"scope_path" <@ ?::ltree');
    expect(fragment.params).toEqual(["platform.acme"]);
  });

  it("refuses a path that is not an ltree path", () => {
    expect(() => descendantOf(Connections.columns.scopePath, "platform|acme")).toThrow(
      /not an ltree path/,
    );
  });
});
