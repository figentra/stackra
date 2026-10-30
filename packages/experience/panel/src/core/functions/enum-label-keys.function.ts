/**
 * Stackra file contract:
 * Purpose: `enumLabelKeys(resourceKey, path, code)`, the derived label keys an enum code at a record path may have, most
 *          specific first: `<module>::enums.<model>_<field>.<code>` (`orders::enums.order_status.paid`), then
 *          `<module>::enums.<field>.<code>`. None for a value that is not a snake_case code.
 * Boundary: internal; pure. An enum object carries no name, so the label is found by these conventions unless the column
 *           or entry names its labels (`.labels(I18n.<module>.enums.<enum>)`); the page shows the first key its
 *           catalogue has, else the code. An enum another module declares needs `.labels`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 decision 22 (derived enum labels); ADR 0231 (snake_case codes).
 */
import type { I18nKey } from "@stackra/i18n";
import { snakeCase } from "@stackra/support";

/** A snake_case code (ADR 0231). */
const CODE = /^[a-z][a-z0-9_]*$/;

/**
 * The candidate label keys of `code` at `path` of a `resourceKey` record.
 *
 * @example
 * enumLabelKeys("orders.order", "status", "paid"); // ["orders::enums.order_status.paid", "orders::enums.status.paid"]
 */
export function enumLabelKeys(resourceKey: string, path: string, code: string): I18nKey[] {
  if (!CODE.test(code)) return [];
  const dot = resourceKey.indexOf(".");
  const module = resourceKey.slice(0, dot);
  const model = resourceKey.slice(dot + 1);
  const field = snakeCase(path.slice(path.lastIndexOf(".") + 1));
  return [`${module}::enums.${model}_${field}.${code}`, `${module}::enums.${field}.${code}`].map(
    (key) => key as I18nKey,
  );
}
