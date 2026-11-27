/**
 * Stackra file contract:
 * Purpose: unit tests of `scopedQueryInput`: defaults for the limit and timeout, a trailing `;` dropped, and a
 *          refusal naming each input out of bounds, a `set_config` call included.
 * Boundary: test only; pure values, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decision 5); STA-2906.
 */
import { describe, expect, it } from "@stackra/testing";

import { InspectionRefusedError } from "#node/errors/inspection-refused.error";
import { scopedQueryInput } from "#node/functions/scoped-query-input.function";

const ACME = "scp_01jab3k4m5n6p7q8r9s0t1v2w3";

describe("scopedQueryInput", () => {
  it("fills the defaults and drops a trailing semicolon", () => {
    expect(scopedQueryInput({ sql: "  select * from notes.notes ;\n", scope: ACME })).toEqual({
      sql: "select * from notes.notes",
      scope: ACME,
      role: undefined,
      limit: 100,
      timeoutMs: 5000,
    });
    expect(
      scopedQueryInput({ sql: "select 1", scope: ACME, role: "encore-admin", limit: 1000 }),
    ).toMatchObject({ role: "encore-admin", limit: 1000 });
    expect(scopedQueryInput({ sql: "select 1", scope: ACME, role: "" }).role).toBeUndefined();
  });

  it("refuses a query that could change its own tenant or role", () => {
    expect(() =>
      scopedQueryInput({
        sql: "select set_config('app.tenant_id', 'scp_other', true), * from notes.notes",
        scope: ACME,
      }),
    ).toThrow(/set_config/);
    expect(() =>
      scopedQueryInput({ sql: "select SET_CONFIG ('role','postgres',true)", scope: ACME }),
    ).toThrow(InspectionRefusedError);
  });

  it("refuses an empty or oversized query", () => {
    expect(() => scopedQueryInput({ sql: " ; ", scope: ACME })).toThrow("the query is empty");
    expect(() => scopedQueryInput({ sql: `select '${"x".repeat(20_000)}'`, scope: ACME })).toThrow(
      "longer than 20000 characters",
    );
  });

  it("refuses a tenant or a role that is not a plain name", () => {
    expect(() => scopedQueryInput({ sql: "select 1", scope: "" })).toThrow("is not a tenant id");
    expect(() => scopedQueryInput({ sql: "select 1", scope: "a' or '1'='1" })).toThrow(
      "is not a tenant id",
    );
    expect(() =>
      scopedQueryInput({ sql: "select 1", scope: ACME, role: 'postgres"; drop' }),
    ).toThrow("is not a role name");
  });

  it("keeps the limit and timeout inside the bounds", () => {
    for (const limit of [0, 1001, 1.5])
      expect(() => scopedQueryInput({ sql: "select 1", scope: ACME, limit })).toThrow(
        "the limit is 1 to 1000 rows",
      );
    for (const timeoutMs of [99, 30_001])
      expect(() => scopedQueryInput({ sql: "select 1", scope: ACME, timeoutMs })).toThrow(
        "the timeout is 100 to 30000 milliseconds",
      );
  });
});
