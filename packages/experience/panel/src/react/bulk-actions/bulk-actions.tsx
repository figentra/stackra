/**
 * Stackra file contract:
 * Purpose: `BulkActions`, the panel's server-driven bulk bar: `@stackra/ui`'s `BulkActionBar` over the selection's
 *          action specs, each with its icon, description, shortcut, tone and disabled reason, run once per selected record
 *          or once over the whole selection by the spec's run mode, the bulk export when asked for, and "select all
 *          matching" only when the spec allows it.
 * Boundary: composition of @stackra/ui's `BulkActionBar` only; runs nothing itself (`onAction` and `onExport` are the
 *           host's). An action is hidden without its permission; record predicates do not apply to a selection. With
 *           every matching record chosen, the ids are still the selected keys: the host reads `isAllMatchingSelected`.
 * Runtime: browser
 * Governing contract: ADR 0307 (rule 3); ADR 0504; ADR 0165 (UI through @stackra/ui); the SDUI catalogue case
 *                     `bulkActions` (STA-1981).
 */
import { useTranslation } from "@stackra/i18n/react";
import type { ResourceAction } from "@stackra/ui/contracts";
import { BulkActionBar } from "@stackra/ui/react";
import type { ReactElement } from "react";

import { resourceActionLook } from "#core/functions/resource-action-look.function";
import { specLabel } from "#core/functions/spec-label.function";
import { specText } from "#core/functions/spec-text.function";
import { useCan } from "#react/action-runner/use-can";
import type { BulkActionsProps } from "#react/bulk-actions/bulk-actions.props";

/**
 * The bar over a selection.
 *
 * @example
 * <BulkActions actions={[{ action: "orders.order.cancel@1", tone: "danger" }]} runMode="once" selectedKeys={selected}
 *   onClearSelection={clear} onAction={run} />
 */
export function BulkActions({
  actions,
  selectedKeys,
  onClearSelection,
  onAction,
  onExport,
  exportLabel,
  runMode = "per-record",
  allowSelectAllMatching = false,
  export: hasExport = false,
  label,
  clearLabel,
  moreActionsLabel,
  totalCount,
  isAllMatchingSelected,
  onAllMatchingSelectedChange,
  ...bar
}: BulkActionsProps): ReactElement {
  const { t } = useTranslation();
  const can = useCan();
  const words = (text: string | undefined) => (text === undefined ? undefined : specText(text, t));
  const items: ResourceAction[] = actions
    .filter((spec) => can(spec.permission))
    .map((spec) => ({
      ...resourceActionLook(spec),
      id: spec.action,
      label: specLabel(spec, t),
      onPress: async () => {
        if (runMode === "once") return onAction(spec, selectedKeys);
        // One run per record, so the policy decides each one (ADR 0307 rule 3).
        for (const id of selectedKeys) await onAction(spec, [id]);
      },
    }));
  if (hasExport && onExport !== undefined && exportLabel !== undefined)
    items.push({
      id: "export",
      label: specText(exportLabel, t),
      onPress: () => onExport(selectedKeys),
    });
  return (
    <BulkActionBar
      {...bar}
      selectedCount={selectedKeys.length}
      actions={items}
      onClearSelection={onClearSelection}
      label={words(label)}
      clearLabel={words(clearLabel)}
      moreActionsLabel={words(moreActionsLabel)}
      {...(allowSelectAllMatching
        ? { totalCount, isAllMatchingSelected, onAllMatchingSelectedChange }
        : {})}
    />
  );
}
