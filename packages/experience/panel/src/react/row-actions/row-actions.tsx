/**
 * Stackra file contract:
 * Purpose: `RowActions`, the panel's server-driven row menu: `@stackra/ui`'s `ActionMenu` over the row's action specs,
 *          grouped into the spec's sections (an action no section names goes in a last, untitled one), each item with
 *          its icon, description, shortcut, tone, disabled reason and link; with `hasHoverActions`, the actions that have
 *          an icon also show as icon buttons, revealed while the pointer is over the row or focus is in it.
 * Boundary: composition of @stackra/ui's `ActionMenu` and `IconButton` only. An action is hidden without its permission
 *           or while its record predicate is not true, and nothing is drawn when none is left. Runs nothing itself:
 *           `onAction` is the host's. The hover buttons show on a parent with Tailwind's `group/row` (as `DataTable`'s
 *           rows), and always on keyboard focus.
 * Runtime: browser
 * Governing contract: ADR 0307 (rule 3); ADR 0504; ADR 0165 (UI through @stackra/ui); the SDUI catalogue case
 *                     `rowActions` (STA-1981).
 */
import { useTranslation } from "@stackra/i18n/react";
import type { MenuSection, ResourceAction } from "@stackra/ui/contracts";
import { ActionMenu, IconButton } from "@stackra/ui/react";
import type { ReactElement } from "react";

import { resourceActionLook } from "#core/functions/resource-action-look.function";
import { shownWhen } from "#core/functions/shown-when.function";
import { specLabel } from "#core/functions/spec-label.function";
import { specText } from "#core/functions/spec-text.function";
import { useCan } from "#react/action-runner/use-can";
import type { RowActionsProps } from "#react/row-actions/row-actions.props";

/** Shown while the pointer is over the row or focus is in it; touch reaches the actions through the menu. */
const HOVER_CLASS =
  "opacity-0 transition-opacity focus-visible:opacity-100 group-focus-within/row:opacity-100 group-hover/row:opacity-100 motion-reduce:transition-none";

/**
 * One row's actions.
 *
 * @example
 * <RowActions label="Actions for order 1001" actions={[{ action: "orders.order.cancel@1", startIcon: "x" }]}
 *   record={order} onAction={run} hasHoverActions />
 */
export function RowActions({
  actions,
  sections,
  label,
  icon,
  variant,
  size,
  hasHoverActions = false,
  record,
  onAction,
}: RowActionsProps): ReactElement | null {
  const { t } = useTranslation();
  const can = useCan();
  const items: ResourceAction[] = actions
    .filter((spec) => can(spec.permission) && shownWhen(spec.visibleWhen, record))
    .map((spec) => ({
      ...resourceActionLook(spec),
      id: spec.action,
      label: specLabel(spec, t),
      ...(spec.href === undefined ? { onPress: () => onAction(spec) } : {}),
    }));
  if (items.length === 0) return null;
  const name = specText(label, t);
  const named = new Set(sections?.flatMap((section) => section.actions) ?? []);
  const rest = items.filter((item) => !named.has(item.id));
  const groups: MenuSection[] = [
    ...(sections ?? []).map((section, index) => ({
      id: `section_${index}`,
      title: section.label === undefined ? name : specText(section.label, t),
      isTitleHidden: section.label === undefined,
      items: section.actions.flatMap((id) => items.filter((item) => item.id === id)),
    })),
    ...(rest.length === 0 ? [] : [{ id: "rest", title: name, isTitleHidden: true, items: rest }]),
  ].filter((group) => group.items.length > 0);
  const hover = hasHoverActions
    ? items.flatMap((item) =>
        item.icon !== undefined && item.href === undefined ? [{ ...item, icon: item.icon }] : [],
      )
    : [];
  return (
    <div className="flex items-center justify-end gap-1">
      {hover.map((item) => (
        <IconButton
          key={item.id}
          icon={item.icon}
          label={item.label}
          variant="ghost"
          size="sm"
          isDisabled={item.isDisabled}
          onPress={() => void item.onPress?.()}
          className={HOVER_CLASS}
        />
      ))}
      <ActionMenu label={name} sections={groups} icon={icon} variant={variant} size={size} />
    </div>
  );
}
