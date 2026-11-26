/**
 * Stackra file contract:
 * Purpose: `FIELD_TYPES`, the types `stackra new model --fields` and `stackra new migration --fields` accept, each
 *          with its property type, decorator and column: `string` (varchar 255), `text`, `int`, `bool`, `timestamp` and
 *          `uuid`.
 * Boundary: data only. A type not listed here (money, decimals, JSON, enums, relations) is written by hand after
 *           the scaffold.
 * Runtime: node
 * Governing contract: ADR 0294 (rule R4); ADR 0159 (the Blueprint column calls).
 */
import type { FieldType } from "#node/feature-scaffold/types/field-type.type";

/** `--fields` type to its property, decorator and column. */
export const FIELD_TYPES: Readonly<Record<string, FieldType>> = Object.freeze({
  string: {
    ts: "string",
    decorator: "@Str({ max: 255 })",
    blueprint: (column) => `t.string(${JSON.stringify(column)}, 255)`,
  },
  text: { ts: "string", blueprint: (column) => `t.string(${JSON.stringify(column)})` },
  int: {
    ts: "number",
    decorator: "@Int",
    blueprint: (column) => `t.integer(${JSON.stringify(column)})`,
  },
  bool: { ts: "boolean", blueprint: (column) => `t.boolean(${JSON.stringify(column)})` },
  timestamp: { ts: "Date", blueprint: (column) => `t.timestamp(${JSON.stringify(column)})` },
  uuid: { ts: "string", blueprint: (column) => `t.uuid(${JSON.stringify(column)})` },
});
