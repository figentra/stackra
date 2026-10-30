/**
 * Stackra file contract:
 * Purpose: `ResourceValue`, one value of a resource row or record as text: money in its currency, a list as its length
 *          (`count`), a principal by its name, a flag as a localised yes or no, an enum code by its label, a date, or
 *          the value as typed.
 * Boundary: internal to the resource pages; reads the value and, for money, the currency beside it. An enum code takes
 *           the label its column or entry names (`labels`), else the first derived key the catalogue has
 *           (`enumLabelKeys`), else shows as its code.
 * Runtime: browser
 * Governing contract: ADR 0307 (rule 1: wire paths); ADR 0164; ADR 0294 decision 22 (derived enum labels).
 */
import type { I18nKey } from "@stackra/i18n";
import { useMoney, useTranslation } from "@stackra/i18n/react";
import type { ReactElement } from "react";

import { PANEL_KEYS } from "#core/constants/panel-keys.constant";
import { enumLabelKeys } from "#core/functions/enum-label-keys.function";

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

/** The text of the first of `keys` the catalogue has; `t` throws on a key it lacks. */
function firstLabel(t: (key: I18nKey) => string, keys: readonly I18nKey[]): string | undefined {
  for (const key of keys) {
    try {
      return t(key);
    } catch {
      // Not in the catalogue: try the next derived key.
    }
  }
  return undefined;
}

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
  if (kind === "money" && typeof value === "number" && typeof currency === "string")
    return <>{money(value, currency)}</>;
  if (kind === "count") return <>{Array.isArray(value) ? value.length : text(value)}</>;
  if (typeof value === "boolean")
    return <>{t(value ? PANEL_KEYS.panel.resources.yes : PANEL_KEYS.panel.resources.no)}</>;
  if (typeof value === "string") {
    const named = labels?.[value];
    if (named !== undefined) return <>{t(named)}</>;
    const label = firstLabel(t, enumLabelKeys(resourceKey, path, value));
    if (label !== undefined) return <>{label}</>;
  }
  return <>{text(value)}</>;
}
