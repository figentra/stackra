/**
 * Stackra file contract:
 * Purpose: `actionLabelKey(resourceKey, actionKey)`, the label key of an action button on a resource:
 *          `<module>::resources.<model>.actions.<verb>` for an action of the resource's own model, and
 *          `…actions.<action_model>_<verb>` for one of another model, so `company_member.set` and `company_minimum.set`
 *          on one page take two keys.
 * Boundary: internal; pure. Reads the action key's model and verb (`<module>.<model>.<verb>@<n>`); the version is
 *           dropped. Web and native pages share it.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (labels are derived); ADR 0294 decision 20 (derived identities).
 */
import type { I18nKey } from "@stackra/i18n";

import { resourceLabel } from "#core/functions/resource-label.function";

/**
 * The label key of `actionKey` placed on `resourceKey`.
 *
 * @example
 * actionLabelKey("commerce.company", "commerce.company_member.set@1"); // "commerce::resources.company.actions.company_member_set"
 */
export function actionLabelKey(resourceKey: string, actionKey: string): I18nKey {
  const segments = actionKey.replace(/@\d+$/, "").split(".");
  const verb = segments.at(-1) ?? actionKey;
  const model = segments.at(-2);
  const own = resourceKey.slice(resourceKey.indexOf(".") + 1);
  return resourceLabel(
    resourceKey,
    "actions",
    model === undefined || model === own ? verb : `${model}_${verb}`,
  );
}
