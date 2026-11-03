/**
 * Stackra file contract:
 * Purpose: `QuickCreate`, the panel's quick-create menu: one entry per registered resource of the current panel's area
 *          that opts in (`quickCreate: true`) and whose create action the viewer may run; choosing one opens the create
 *          action's form in a dialog (`ActionInputModal`), so a record is made without leaving the page.
 * Boundary: needs a `PanelShell` above it. Reads what `registerPanelPages` registered and the recorded trees; a resource
 *           whose create operation is not a client ref (`true` before gen writes it) is not offered. The dialog asks for
 *           the action's input keys and runs through the action runner, so the declared confirmation, the cache refresh
 *           and the toasts are the runner's. Draws nothing when no resource is offered.
 * Runtime: browser
 * Governing contract: ADR 0307 (rule 21: quick create is opt-in per resource); ADR 0164; the SDUI catalogue case
 *                     `resources` (quickCreate), build-list item 53 (STA-1981).
 */
import type { ActionRef } from "@stackra/clients";
import { useTranslation } from "@stackra/i18n/react";
import type { MenuSection } from "@stackra/ui/contracts";
import { ActionMenu } from "@stackra/ui/react";
import { useState, type ReactElement } from "react";

import { PANEL_KEYS } from "#core/constants/panel-keys.constant";
import { actionFormKeys } from "#core/functions/action-form-keys.function";
import { resourceLabel } from "#core/functions/resource-label.function";
import { resourceTreeOf } from "#core/functions/resource-tree-of.function";
import { useCan } from "#react/action-runner/use-can";
import { usePanel } from "#react/panel-shell/use-panel";
import type { QuickCreateProps } from "#react/quick-create/quick-create.props";
import { ActionInputModal } from "#react/resource-pages/action-input-modal";
import { PANEL_PAGES } from "#react/route-pages/panel-pages.constant";

/**
 * The quick-create menu of the current panel.
 *
 * @throws Error outside a `PanelShell`.
 * @example
 * <AppLayout navbar={<Navbar end={<QuickCreate />} />} />
 */
export function QuickCreate({
  label,
  icon = "plus",
  variant = "secondary",
  size,
}: QuickCreateProps): ReactElement | null {
  const { t } = useTranslation();
  const panel = usePanel();
  const can = useCan();
  const [open, setOpen] = useState<{ readonly key: string; readonly action: ActionRef } | null>(
    null,
  );
  const offered = (PANEL_PAGES.current.resources ?? []).flatMap((routes) => {
    const options = resourceTreeOf(routes.key).options;
    const create = options?.operations.create;
    if (options?.area !== panel.area || options.quickCreate !== true) return [];
    if (typeof create !== "function") return [];
    const action = create as ActionRef;
    return can(action.permission) ? [{ key: routes.key, action }] : [];
  });
  if (offered.length === 0) return null;
  const name = label ?? t(PANEL_KEYS.panel.resources.create);
  const sections: MenuSection[] = [
    {
      id: "quick_create",
      title: name,
      isTitleHidden: true,
      items: offered.map((entry) => ({
        id: entry.key,
        label: t(resourceLabel(entry.key, "title")),
        onPress: () => setOpen(entry),
      })),
    },
  ];
  return (
    <>
      <ActionMenu label={name} sections={sections} icon={icon} variant={variant} size={size} />
      {open === null ? null : (
        <ActionInputModal
          resourceKey={open.key}
          action={open.action}
          keys={actionFormKeys(open.action.input)}
          onClose={() => setOpen(null)}
        />
      )}
    </>
  );
}
