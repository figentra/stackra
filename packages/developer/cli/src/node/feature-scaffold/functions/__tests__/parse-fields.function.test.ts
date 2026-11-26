/**
 * Stackra file contract:
 * Purpose: unit tests of `parseFields`: each `<name>:<type>[?]` becomes a camelCase property, a snake_case column,
 *          its type, decorator and Blueprint call, and a nullable flag; an empty list is none; a bad entry, an
 *          unknown type, a repeated name and a name the scaffold writes itself are refused.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 20); ADR 0159.
 */
import { describe, expect, it } from "@stackra/testing";

import { CliUsageError } from "#node/errors/cli-usage.error";
import { parseFields } from "#node/feature-scaffold/functions/parse-fields.function";

describe(parseFields, () => {
  it("reads each field's property, column, type, decorator, column call and nullability", () => {
    expect(parseFields("title:string,due_at:timestamp?,count:int,paid:bool")).toEqual([
      {
        name: "title",
        column: "title",
        type: "string",
        nullable: false,
        decorators: ["@Str({ max: 255 })"],
        doc: "The title.",
        blueprint: 't.string("title", 255)',
      },
      {
        name: "dueAt",
        column: "due_at",
        type: "Date",
        nullable: true,
        decorators: [],
        doc: "The due at.",
        blueprint: 't.timestamp("due_at")',
      },
      {
        name: "count",
        column: "count",
        type: "number",
        nullable: false,
        decorators: ["@Int"],
        doc: "The count.",
        blueprint: 't.integer("count")',
      },
      {
        name: "paid",
        column: "paid",
        type: "boolean",
        nullable: false,
        decorators: [],
        doc: "True when paid.",
        blueprint: 't.boolean("paid")',
      },
    ]);
  });

  it("is empty for no list", () => {
    expect(parseFields(undefined)).toEqual([]);
    expect(parseFields(" ")).toEqual([]);
  });

  it.each([
    ["title", '--fields: "title" is not <name>:<type>, such as title:string or due_at:timestamp?'],
    [
      "Title:string",
      '--fields: "Title:string" is not <name>:<type>, such as title:string or due_at:timestamp?',
    ],
    [
      "title:money",
      '--fields: "money" is not a type; one of string, text, int, bool, timestamp, uuid',
    ],
    ["title:string,title:text", "--fields: title is named twice"],
    ["createdAt:timestamp", "--fields: createdAt is written by the scaffold itself"],
  ])("refuses %s", (spec, message) => {
    expect(() => parseFields(spec)).toThrow(new CliUsageError(message));
  });
});
