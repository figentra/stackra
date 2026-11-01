/**
 * Stackra file contract:
 * Purpose: `useEnumLabel()`, the label of an enum code at a record or input path: the key the column, entry or field
 *          names (`labels`), else the first derived key the catalogue has (`enumLabelKeys`), else none.
 * Boundary: internal to the resource pages; `ResourceValue` shows values with it and `ResourceFormField` a select's
 *           options. `t` throws on a key the catalogue lacks, so each derived key is tried in turn.
 * Runtime: browser
 * Governing contract: ADR 0294 decision 22 (derived enum labels); ADR 0307.
 */
import type { I18nKey } from "@stackra/i18n";
import { useTranslation } from "@stackra/i18n/react";

import { enumLabelKeys } from "#core/functions/enum-label-keys.function";

/**
 * The enum label finder of the current locale.
 *
 * @example
 * const enumLabel = useEnumLabel();
 * enumLabel("orders.order", "status", "paid"); // "Paid"
 */
export function useEnumLabel(): (
  resourceKey: string,
  path: string,
  code: string,
  labels?: Readonly<Record<string, I18nKey>>,
) => string | undefined {
  const { t } = useTranslation();
  return (resourceKey, path, code, labels) => {
    const named = labels?.[code];
    if (named !== undefined) return t(named);
    for (const key of enumLabelKeys(resourceKey, path, code)) {
      try {
        return t(key);
      } catch {
        // Not in the catalogue: try the next derived key.
      }
    }
    return undefined;
  };
}
