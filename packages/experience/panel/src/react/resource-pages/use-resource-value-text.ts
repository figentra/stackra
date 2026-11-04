/**
 * Stackra file contract:
 * Purpose: `useResourceValueText(props)`, one value of a resource row or record as text: money in its currency, a list
 *          as its length (`count`), a money object (`{ minor, currency }`) in its currency, a principal by its name, a
 *          flag as a localised yes or no, an enum code by its label, a date, or the value as typed.
 * Boundary: platform-free: imports `react` hooks and no UI kit, so the web and native `ResourceValue` show the same
 *           text, each in its own element. A money object is recognised by its shape, so the panel needs no dependency
 *           on `@stackra/money`. An enum code takes its label (`useEnumLabel`), else shows as its code.
 * Runtime: isomorphic (react)
 * Governing contract: ADR 0307 (rule 1: wire paths); ADR 0164; ADR 0294 decision 22 (derived enum labels).
 */
import { useMoney, useTranslation } from "@stackra/i18n/react";

import { PANEL_KEYS } from "#core/constants/panel-keys.constant";
import { isMoneyAmount } from "#core/functions/is-money-amount.function";
import { plainText } from "#core/functions/plain-text.function";
import type { ResourceValueProps } from "#react/resource-pages/resource-value.props";
import { useEnumLabel } from "#react/resource-pages/use-enum-label";

/**
 * The text of one value, formatted for its column or entry kind.
 *
 * @example
 * const text = useResourceValueText({ resourceKey: "orders.order", path: "status", kind: "value", value: "paid" });
 */
export function useResourceValueText({
  resourceKey,
  path,
  kind,
  value,
  currency,
  labels,
}: ResourceValueProps): string | number {
  const money = useMoney();
  const { t } = useTranslation();
  const enumLabel = useEnumLabel();
  if (kind === "money" && typeof value === "number" && typeof currency === "string")
    return money(value, currency);
  // A money object is money wherever it shows (a list cell, a column, an entry), whatever the kind.
  if (isMoneyAmount(value)) return money(value.minor, value.currency);
  if (kind === "count") return Array.isArray(value) ? value.length : plainText(value);
  if (typeof value === "boolean")
    return t(value ? PANEL_KEYS.panel.resources.yes : PANEL_KEYS.panel.resources.no);
  const label = typeof value === "string" ? enumLabel(resourceKey, path, value, labels) : undefined;
  return label ?? plainText(value);
}
