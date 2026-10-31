/**
 * Stackra file contract:
 * Purpose: `mockTamoFilter`, the offline mock's ask-to-filter: a choice named by its value or label, a number over or under
 *          an amount, a text column named something, and newest, oldest, highest or lowest first, in English and Arabic.
 * Boundary: demo only, deterministic; conditions use the quick-filter ids (`filter:<column>`) so they replace the bar's chips.
 * Runtime: isomorphic
 * Governing contract: ADR 0507 (ask in words: proposed chips); ADR 0505 (one filter model).
 */
import type { RuleCondition, SortDescriptor, TamoTasks } from "@stackra/ui/contracts";

// shortcut: the quick-filter id rule of @stackra/ui (`quickFilterIdOf`) written out; import it if it moves to contracts.
/** A quick filter's condition id. */
const idOf = (column: string) => `filter:${column}`;

/** Arabic words the mock reads as the demo's choice values. */
const ARABIC_CHOICES: Readonly<Record<string, RegExp>> = {
  paid: /مدفوع/u,
  pending: /معلق|قيد الانتظار/u,
  refunded: /مسترد|مستردة/u,
};
/** Column words that mark the money column a number filter means. */
const AMOUNT = /total|amount|price|value|الإجمالي|المبلغ|السعر|القيمة/iu;

/** The mock's filter and sort for words over columns. */
export function mockTamoFilter(input: TamoTasks["filter"]["input"]): TamoTasks["filter"]["output"] {
  const text = input.text.toLowerCase();
  const conditions: RuleCondition[] = [];
  const sort: SortDescriptor[] = [];
  for (const column of input.columns) {
    if (column.type === "choice" && column.options) {
      const named = column.options.filter(
        (option) =>
          new RegExp(`\\b${option.toLowerCase()}\\b`, "u").test(text) ||
          (ARABIC_CHOICES[option]?.test(text) ?? false),
      );
      if (named.length > 0)
        conditions.push({ id: idOf(column.id), field: column.id, operator: "in", value: named });
    }
  }
  const numbers = input.columns.filter((column) => column.type === "number");
  const amount =
    numbers.find((column) => AMOUNT.test(`${column.id} ${column.label}`)) ?? numbers[0];
  const over = /(?:over|above|more than|at least|>|فوق|أكثر من)\s*(\d+(?:\.\d+)?)/u.exec(text);
  const under = /(?:under|below|less than|<|أقل من|تحت)\s*(\d+(?:\.\d+)?)/u.exec(text);
  if (amount && (over || under))
    conditions.push({
      id: idOf(amount.id),
      field: amount.id,
      operator: "between",
      value: [over?.[1] ?? "", under?.[1] ?? ""],
    });
  const named = /(?:named|called|from|اسمه|من)\s+([\p{L}\p{N}-]+)/u.exec(input.text);
  const textColumn = input.columns.find((column) => (column.type ?? "text") === "text");
  if (named?.[1] && textColumn)
    conditions.push({
      id: idOf(textColumn.id),
      field: textColumn.id,
      operator: "contains",
      value: named[1],
    });
  const date = input.columns.find((column) => column.type === "date");
  if (date && /newest|latest|recent|الأحدث/u.test(text))
    sort.push({ column: date.id, direction: "descending" });
  if (date && /oldest|الأقدم/u.test(text)) sort.push({ column: date.id, direction: "ascending" });
  if (amount && /highest|largest|biggest|most|الأعلى|الأكبر/u.test(text))
    sort.push({ column: amount.id, direction: "descending" });
  if (amount && /lowest|smallest|cheapest|الأقل|الأصغر/u.test(text))
    sort.push({ column: amount.id, direction: "ascending" });
  return { conditions, sort };
}
