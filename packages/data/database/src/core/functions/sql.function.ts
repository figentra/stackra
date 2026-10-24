/**
 * Stackra file contract:
 * Purpose: `sql`, the tag of the one raw condition a filter may carry (`{ $raw: sql\`...\` }`): a `ColumnRef` is written
 *          as its quoted name, a nested `sql` fragment is inlined with its parameters, and every other value becomes a
 *          bound parameter.
 * Boundary: builds a MikroORM raw fragment; never interpolates a value into the text. A raw query lives only in a
 *           module service method, with a `// raw-sql:` comment saying why (ADR 0160).
 * Runtime: node
 * Governing contract: ADR 0160 (decision 1: typed, parameterised raw SQL).
 */
import { isRaw, raw } from "@mikro-orm/core";
import type { RawQueryFragment } from "@mikro-orm/core";

import { ColumnRef } from "#core/values/column-ref.value";

/**
 * A parameterised SQL fragment.
 *
 * @example
 * // raw-sql: available stock is a difference of two columns, which a typed filter cannot express
 * this.find({ $raw: sql`${StockLevels.columns.onHand} - ${StockLevels.columns.reserved} <= ${threshold}` });
 */
export function sql(
  strings: TemplateStringsArray,
  ...values: readonly unknown[]
): RawQueryFragment {
  let text = strings[0] ?? "";
  const params: unknown[] = [];
  values.forEach((value, index) => {
    if (value instanceof ColumnRef) text += value.toString();
    else if (isRaw(value)) {
      text += value.sql;
      params.push(...value.params);
    } else {
      text += "?";
      params.push(value);
    }
    text += strings[index + 1] ?? "";
  });
  return raw<RawQueryFragment>(text, params);
}
