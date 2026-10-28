/**
 * Stackra file contract:
 * Purpose: `filterSql(column, key, value)`, the parameterised condition of one table filter value on one resolved
 *          column of a report: equal, `in`, a range, a date range, one comparison, `ilike` for contains (its `%`, `_`
 *          and `\` escaped) and `is null` or `is not null`.
 * Boundary: internal; pure. `column` is already quoted from the generated metadata; every operand is a bound value.
 *           Only the operators above compile, so a caller's object never becomes SQL: anything else, an object
 *           operand or an empty range is refused with `table_filter_invalid`. A named date range (`{ range }`) needs
 *           the call's period, which a report run does not carry yet, so it is refused. A date-only bound is a UTC day,
 *           as in `@stackra/database`'s table filters.
 * Runtime: node
 * Governing contract: ADR 0307 (rule 2: the closed table filter values); ADR 0160 (parameterised SQL); ADR 0470
 *                     (decision 3).
 */
import { TableFilterInvalidError } from "@stackra/database";

import type { SqlFragment } from "#node/types/sql-fragment.type";

const DAY = 86_400_000;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const COMPARISONS: Readonly<Record<string, string>> = {
  gt: ">",
  gte: ">=",
  lt: "<",
  lte: "<=",
  ne: "<>",
};

/** Whether `value` is a scalar operand. */
function isOperand(value: unknown): boolean {
  return (
    ["string", "number", "boolean", "bigint"].includes(typeof value) ||
    (value instanceof Date && !Number.isNaN(value.getTime()))
  );
}

/**
 * The condition of `value` on `column`.
 *
 * @param column - the quoted, aliased column (`row."status"`).
 * @param key - the dimension name or path, named in a refusal.
 * @param value - the filter value, a `TableFilter`.
 * @throws TableFilterInvalidError for a value outside the vocabulary, or a named date range.
 * @example
 * filterSql('row."total_minor"', "total", { op: "range", from: 10, to: 20 });
 * // { sql: 'row."total_minor" >= ? and row."total_minor" <= ?', params: [10, 20] }
 */
export function filterSql(column: string, key: string, value: unknown): SqlFragment {
  const refuse = (reason: string): TableFilterInvalidError =>
    TableFilterInvalidError.create({ key, reason });
  if (value === null) return { sql: `${column} is null`, params: [] };
  if (isOperand(value)) return { sql: `${column} = ?`, params: [value] };
  if (Array.isArray(value)) {
    if (!value.every(isOperand)) throw refuse("a list holds only scalar values");
    if (value.length === 0) return { sql: "false", params: [] };
    return { sql: `${column} in (${value.map(() => "?").join(", ")})`, params: value };
  }
  if (typeof value !== "object")
    throw refuse("a filter value is a scalar, a list or an operator object");
  const { op, ...rest } = value as Record<string, unknown> & { readonly op?: unknown };
  const bound = (name: string): unknown => {
    const operand = rest[name];
    if (operand !== undefined && !isOperand(operand)) throw refuse(`${name} is not a scalar value`);
    return operand;
  };
  const between = (from: unknown, to: unknown, upper: "<=" | "<"): SqlFragment => {
    const parts = [
      ...(from === undefined ? [] : [`${column} >= ?`]),
      ...(to === undefined ? [] : [`${column} ${upper} ?`]),
    ];
    return {
      sql: parts.join(" and "),
      params: [from, to].filter((operand) => operand !== undefined),
    };
  };
  switch (op) {
    case "range": {
      const from = bound("from");
      const to = bound("to");
      if (from === undefined && to === undefined) throw refuse("a range needs from or to");
      return between(from, to, "<=");
    }
    case "dateRange": {
      if (rest["range"] !== undefined)
        throw refuse("a named range is not available in a report filter; send from and to");
      const instant = (name: string, inclusiveDay: boolean): Date | undefined => {
        const operand = bound(name);
        if (operand === undefined) return undefined;
        const date =
          typeof operand === "string" && DATE_ONLY.test(operand)
            ? new Date(Date.parse(`${operand}T00:00:00Z`) + (inclusiveDay ? DAY : 0))
            : operand instanceof Date
              ? operand
              : typeof operand === "string"
                ? new Date(operand)
                : undefined;
        if (date === undefined || Number.isNaN(date.getTime()))
          throw refuse(`${name} is not a date`);
        return date;
      };
      const from = instant("from", false);
      const to = instant("to", true);
      if (from === undefined && to === undefined) throw refuse("a date range needs from or to");
      return between(from, to, "<");
    }
    case "contains": {
      const text = rest["value"];
      if (typeof text !== "string" || text === "") throw refuse("contains needs non-empty text");
      return {
        sql: `${column} ilike ?`,
        params: [`%${text.replaceAll(/[\\%_]/g, (match) => `\\${match}`)}%`],
      };
    }
    case "isNull": {
      if (typeof rest["value"] !== "boolean") throw refuse("isNull needs true or false");
      return { sql: `${column} is ${rest["value"] ? "" : "not "}null`, params: [] };
    }
    default: {
      const operator =
        typeof op === "string" && Object.hasOwn(COMPARISONS, op) ? COMPARISONS[op] : undefined;
      if (operator === undefined) throw refuse(`unknown operator ${JSON.stringify(op)}`);
      const operand = bound("value");
      if (operand === undefined) throw refuse(`${String(op)} needs a value`);
      return { sql: `${column} ${operator} ?`, params: [operand] };
    }
  }
}
