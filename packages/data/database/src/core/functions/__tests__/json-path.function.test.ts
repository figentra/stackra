/**
 * Stackra file contract:
 * Purpose: unit tests of `jsonPath`: one placeholder per key, the value compared as jsonb, and a refusal of an empty
 *          path or key.
 * Boundary: test only; inspects the MikroORM fragment, runs no query.
 * Runtime: node (vitest)
 * Governing contract: ADR 0160 (decision 1); ADR 0022; ADR 0269.
 */
import { describe, expect, it } from "@stackra/testing";

import { jsonPath } from "#core/functions/json-path.function";
import { table } from "#core/functions/table.function";

const Entries = table("content.entries", { live: "live" });

describe(jsonPath, () => {
  it("binds each key and the value, compared as jsonb", () => {
    const fragment = jsonPath(Entries.columns.live, ["slug", "en"], "pricing");
    expect(fragment.sql).toBe(`coalesce("live" #> array[?, ?]::text[], 'null'::jsonb) = ?::jsonb`);
    expect(fragment.params).toEqual(["slug", "en", '"pricing"']);
    expect(jsonPath(Entries.columns.live, ["draft"], null).params).toEqual(["draft", "null"]);
  });

  it("refuses an empty path or key", () => {
    expect(() => jsonPath(Entries.columns.live, [], 1)).toThrow(/non-empty keys/);
    expect(() => jsonPath(Entries.columns.live, ["slug", ""], 1)).toThrow(/non-empty keys/);
  });
});
