/**
 * Stackra file contract:
 * Purpose: `ResourceValue`, one value of a resource row or record as text: money in its currency, a list as its length
 *          (`count`), a money object (`{ minor, currency }`) in its currency, a principal by its name, a flag as a localised yes or no, an enum code by its label, a date, or
 *          the value as typed.
 * Boundary: internal to the resource pages; reads the value and, for money, the currency beside it. A money object is
 *           recognised by its shape, so the panel needs no dependency on `@stackra/money`. An enum code takes
 *           its label (`useEnumLabel`), else shows as its code.
 * Runtime: browser
 * Governing contract: ADR 0307 (rule 1: wire paths); ADR 0164; ADR 0294 decision 22 (derived enum labels).
 */
import type { I18nKey } from "@stackra/i18n";
import { useMoney, useTranslation } from "@stackra/i18n/react";
import type { ReactElement } from "react";

import { PANEL_KEYS } from "#core/constants/panel-keys.constant";
import { useEnumLabel } from "#react/resource-pages/use-enum-label";

/** Plain text of `value`. */
function text(value: unknown): string {
  if (value === undefined || value === null || value === "") return "";
  if (value instanceof Date) return value.toLocaleString();
  if (typeof value === "object") {
    const named = (value as { readonly name?: unknown }).name;
    return typeof named === "string" ? named : JSON.stringify(value);
  }
  return String(value as string | number | bigint);
}

/** A money object (`@stackra/money`'s `MoneyAmount`): integer minor units and a currency code. */
const isMoneyAmount = (
  value: unknown,
): value is { readonly minor: number; readonly currency: string } =>
  typeof value === "object" &&
  value !== null &&
  Number.isInteger((value as { readonly minor?: unknown }).minor) &&
  typeof (value as { readonly currency?: unknown }).currency === "string";

/**
 * One value, formatted for its column or entry kind.
 *
 * @example
 * <ResourceValue resourceKey="orders.order" path="totals.totalMinor" kind="money" value={row.totals.totalMinor}
 *   currency={row.totals.currency} />
 */
export function ResourceValue({
  resourceKey,
  path,
  kind,
  value,
  currency,
  labels,
}: {
  readonly resourceKey: string;
  readonly path: string;
  readonly kind: string;
  readonly value: unknown;
  readonly currency?: unknown;
  readonly labels?: Readonly<Record<string, I18nKey>> | undefined;
}): ReactElement {
  const money = useMoney();
  const { t } = useTranslation();
  const enumLabel = useEnumLabel();
  if (kind === "money" && typeof value === "number" && typeof currency === "string")
    return <>{money(value, currency)}</>;
  // A money object is money wherever it shows (a list cell, a column, an entry), whatever the kind.
  if (isMoneyAmount(value)) return <>{money(value.minor, value.currency)}</>;
  if (kind === "count") return <>{Array.isArray(value) ? value.length : text(value)}</>;
  if (typeof value === "boolean")
    return <>{t(value ? PANEL_KEYS.panel.resources.yes : PANEL_KEYS.panel.resources.no)}</>;
  const label = typeof value === "string" ? enumLabel(resourceKey, path, value, labels) : undefined;
  return <>{label ?? text(value)}</>;
}
