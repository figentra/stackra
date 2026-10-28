/**
 * Stackra file contract:
 * Purpose: `filterCondition(key, value, period)`, the ORM condition of one table filter value (`TableFilter`) at one
 *          model path: equal, `$in`, `$gte`/`$lte` for a range, `$gte`/`$lt` for a date range (a named one through
 *          `period`), one comparison, `$ilike` for contains (its `%`, `_` and `\` escaped) and `null` or `$ne: null`.
 * Boundary: internal; pure. It builds only the operators above, so a caller's object never becomes an ORM operator: any
 *           other object, an object operand or an empty range is refused with `table_filter_invalid`. A date-only
 *           bound is a UTC day.
 * Runtime: node
 * Governing contract: ADR 0307 (rule 2: no raw field name or operator reaches SQL); reporting gap 5.
 */
import type { Period, PeriodInput } from "@stackra/actions";

import { TableFilterInvalidError } from "#core/errors/table-filter-invalid.error";

const DAY = 86_400_000;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const COMPARISONS: Readonly<Record<string, string>> = {
  gt: "$gt",
  gte: "$gte",
  lt: "$lt",
  lte: "$lte",
  ne: "$ne",
};

/** Whether `value` is a scalar operand. */
function isOperand(value: unknown): boolean {
  return (
    ["string", "number", "boolean", "bigint"].includes(typeof value) ||
    (value instanceof Date && !Number.isNaN(value.getTime()))
  );
}

/**
 * The ORM condition of `value` at `key`.
 *
 * @param key - the model path, named in a refusal.
 * @param value - the filter value, a `TableFilter`.
 * @param period - resolves a named date range; without it such a range is refused.
 * @throws TableFilterInvalidError for a value outside the `TableFilter` vocabulary.
 * @example
 * filterCondition("total", { op: "range", from: 10, to: 20 }); // { $gte: 10, $lte: 20 }
 * filterCondition("name", { op: "contains", value: "50%" }); // { $ilike: "%50\\%%" }
 */
export function filterCondition(
  key: string,
  value: unknown,
  period?: (input: PeriodInput) => Period,
): unknown {
  const refuse = (reason: string): TableFilterInvalidError =>
    TableFilterInvalidError.create({ key, reason });
  if (value === null || isOperand(value)) return value;
  if (Array.isArray(value)) {
    if (!value.every(isOperand)) throw refuse("a list holds only scalar values");
    return { $in: value };
  }
  if (typeof value !== "object")
    throw refuse("a filter value is a scalar, a list or an operator object");
  const { op, ...rest } = value as Record<string, unknown> & { readonly op?: unknown };
  const bound = (name: string): unknown => {
    const operand = rest[name];
    if (operand !== undefined && !isOperand(operand)) throw refuse(`${name} is not a scalar value`);
    return operand;
  };
  switch (op) {
    case "range": {
      const from = bound("from");
      const to = bound("to");
      if (from === undefined && to === undefined) throw refuse("a range needs from or to");
      return {
        ...(from === undefined ? {} : { $gte: from }),
        ...(to === undefined ? {} : { $lte: to }),
      };
    }
    case "dateRange": {
      if (rest["range"] !== undefined) {
        if (typeof rest["range"] !== "string") throw refuse("range is a named range code");
        if (period === undefined)
          throw refuse(`the named range ${rest["range"]} needs the call's period`);
        let window: Period;
        try {
          window = period({ range: rest["range"] });
        } catch {
          throw refuse(`unknown named range ${JSON.stringify(rest["range"])}`);
        }
        return { $gte: window.from, $lt: window.to };
      }
      const instant = (name: string, inclusiveDay: boolean): Date | undefined => {
        const operand = bound(name);
        if (operand === undefined) return undefined;
        // shortcut: a date-only bound is a UTC day; resolve it in the call's time zone once ctx.period takes calendar days.
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
      if (from === undefined && to === undefined)
        throw refuse("a date range needs from, to or range");
      return {
        ...(from === undefined ? {} : { $gte: from }),
        ...(to === undefined ? {} : { $lt: to }),
      };
    }
    case "contains": {
      const text = rest["value"];
      if (typeof text !== "string" || text === "") throw refuse("contains needs non-empty text");
      return { $ilike: `%${text.replaceAll(/[\\%_]/g, (match) => `\\${match}`)}%` };
    }
    case "isNull": {
      if (typeof rest["value"] !== "boolean") throw refuse("isNull needs true or false");
      return rest["value"] ? null : { $ne: null };
    }
    default: {
      const operator =
        typeof op === "string" && Object.hasOwn(COMPARISONS, op) ? COMPARISONS[op] : undefined;
      if (operator === undefined) throw refuse(`unknown operator ${JSON.stringify(op)}`);
      const operand = bound("value");
      if (operand === undefined) throw refuse(`${String(op)} needs a value`);
      return { [operator]: operand };
    }
  }
}
