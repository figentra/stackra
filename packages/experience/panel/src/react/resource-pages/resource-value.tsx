/**
 * Stackra file contract:
 * Purpose: `ResourceValue`, one value of a resource row or record as text: money in its currency, a list as its length
 *          (`count`), a principal by its name, a flag, a date, or the value as typed.
 * Boundary: internal to the resource pages; reads the value and, for money, the currency beside it. Formats only; it
 *           never fetches a label it does not have (an enum code shows as its code until gen writes enum labels).
 * Runtime: browser
 * Governing contract: ADR 0307 (rule 1: wire paths); ADR 0164.
 */
import { useMoney } from "@stackra/i18n/react";
import type { ReactElement } from "react";

/** Plain text of `value`. */
function text(value: unknown): string {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value === "boolean") return value ? "✓" : "✗";
  if (value instanceof Date) return value.toLocaleString();
  if (typeof value === "object") {
    const named = (value as { readonly name?: unknown }).name;
    return typeof named === "string" ? named : JSON.stringify(value);
  }
  return String(value as string | number | bigint);
}

/**
 * One value, formatted for its column or entry kind.
 *
 * @example
 * <ResourceValue kind="money" value={row.totals.totalMinor} currency={row.totals.currency} />
 */
export function ResourceValue({
  kind,
  value,
  currency,
}: {
  readonly kind: string;
  readonly value: unknown;
  readonly currency?: unknown;
}): ReactElement {
  const money = useMoney();
  if (kind === "money" && typeof value === "number" && typeof currency === "string")
    return <>{money(value, currency)}</>;
  if (kind === "count") return <>{Array.isArray(value) ? value.length : text(value)}</>;
  return <>{text(value)}</>;
}
