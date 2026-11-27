/**
 * Stackra file contract:
 * Purpose: unit tests of `splitSqlStatements`: a string with several statements splits on its top-level semicolons,
 *          while a semicolon inside a literal (`E''` escapes and doubled quotes included), a quoted identifier, a
 *          dollar-quoted body or a comment never splits it, and a part with only whitespace and comments is dropped.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0159 (decision 3); STA-2866.
 */
import { describe, expect, it } from "@stackra/testing";

import { splitSqlStatements } from "#core/functions/split-sql-statements.function";

/** The parts of `sql`, trimmed. */
const partsOf = (sql: string): string[] => splitSqlStatements(sql).map((part) => part.trim());

describe("splitSqlStatements", () => {
  /** Postgres runs every statement of a schema.sql() string; each is a part. */
  it("splits on each top-level semicolon", () => {
    expect(partsOf("comment on table orders is null; drop table orders")).toEqual([
      "comment on table orders is null",
      "drop table orders",
    ]);
    expect(partsOf("create table a (id int);\ncreate index on a (id);\n")).toEqual([
      "create table a (id int)",
      "create index on a (id)",
    ]);
  });

  it("keeps one statement whole, with or without its semicolon", () => {
    expect(partsOf('alter table "orders"."orders" drop column "note"')).toEqual([
      'alter table "orders"."orders" drop column "note"',
    ]);
    expect(partsOf("select 1;")).toEqual(["select 1"]);
  });

  it.each([
    ["a literal", "comment on table x is 'a; drop table y'"],
    ["a doubled quote", "comment on table x is 'it''s; drop table y'"],
    ["an E'' escape", String.raw`comment on table x is E'it\'s; drop table y'`],
    ["a quoted identifier", 'comment on table "a;b" is null'],
    ["a dollar-quoted body", "do $$ begin perform 1; raise notice 'x'; end $$"],
    [
      "a tagged dollar-quoted body",
      "create function f() returns int as $f$ select 1; $f$ language sql",
    ],
    ["a block comment", "select 1 /* a; /* nested; */ b; */"],
  ])("never splits inside %s", (_, sql) => {
    expect(splitSqlStatements(sql)).toHaveLength(1);
  });

  /** A line comment ends at its line: a semicolon there is commented out, the next line is code. */
  it("reads a line comment to its end only", () => {
    expect(partsOf("select 1 -- a; b\n; drop table y")).toEqual([
      "select 1 -- a; b",
      "drop table y",
    ]);
  });

  /** A marker line or a trailing comment is not a statement. */
  it("drops a part with only whitespace and comments", () => {
    expect(partsOf("-- stackra:marker\n")).toEqual([]);
    expect(partsOf("select 1; -- done\n /* end */ ;")).toEqual(["select 1"]);
  });

  /** `$1` is a parameter and `a$b$` an identifier: neither opens a dollar quote. */
  it("opens a dollar quote only at a tag", () => {
    expect(partsOf("select $1; select a$b$; select 2")).toEqual([
      "select $1",
      "select a$b$",
      "select 2",
    ]);
  });
});
