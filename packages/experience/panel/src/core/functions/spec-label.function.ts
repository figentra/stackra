/**
 * Stackra file contract:
 * Purpose: `specLabel(spec, t)`, the words of an `ActionButtonSpec` in a menu: its `label` (words or an i18n key), else
 *          the action's derived label key on the resource its key names (`orders.order.cancel@1` on `orders.order`).
 * Boundary: internal; pure but for `t`. Web and native renderers share it.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 3: action labels are derived keys); ADR 0504 (decision 4); the SDUI catalogue
 *                     cases `rowActions` and `bulkActions` (STA-1981).
 */
import type { I18nKey } from "@stackra/i18n";

import { actionLabelKey } from "#core/functions/action-label-key.function";
import { specText } from "#core/functions/spec-text.function";
import type { ActionButtonSpec } from "#core/types/action-button-spec.type";

/**
 * The menu words of `spec`.
 *
 * @example
 * specLabel({ action: "orders.order.cancel@1" }, t); // t("orders::resources.order.actions.cancel")
 */
export function specLabel(
  spec: Pick<ActionButtonSpec, "action" | "label">,
  t: (key: I18nKey, values?: Readonly<Record<string, unknown>>) => string,
): string {
  if (spec.label !== undefined) return specText(spec.label, t);
  return t(actionLabelKey(spec.action.split(".").slice(0, 2).join("."), spec.action));
}
