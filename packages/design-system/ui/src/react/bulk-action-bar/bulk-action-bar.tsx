/**
 * Stackra file contract:
 * Purpose: the web `BulkActionBar` on HeroUI v3's Toolbar (React Aria): draws the shared contract (`selectedCount`,
 *          `actions`, `onClearSelection`, `isPageSelected`, `totalCount`, `isAllMatchingSelected`,
 *          `onAllMatchingSelectedChange` and the spoken names) as a named toolbar that shows how many records are
 *          selected, one button per action, the "select all N" choice and a clear button, and passes every other `div`
 *          prop to its root.
 * Boundary: no styling of its own beyond the utility classes that lay the bar out. The toolbar is drawn only while
 *           something is selected, but its live status is always in the page, empty, and is filled when the count
 *           changes, because most screen readers announce a live region only when its text changes, not when it is
 *           inserted already full: the count is therefore announced politely and once. An action is busy while its
 *           promise is pending and refuses a second press (`usePendingActions`), a rejection is the app's to report
 *           and leaves the selection as it was, and the bar never changes the selection itself. A disabled action
 *           refuses the pointer and the keyboard (HeroUI takes it out of the tab order) and says why in its accessible
 *           name, which keeps the visible label first (WCAG 2.5.3). "Select all N" is offered only for a fully
 *           selected page with `totalCount` above the selected count, and it is one button whose text changes into
 *           "select only the rows shown", so focus stays on it. An action with an `href` is a link drawn as a button.
 *           Every button is at least 32 px tall (WCAG 2.5.8). The toolbar unmounts when the count reaches 0, which drops
 *           focus held in it (the clear button, or an action that clears the selection), so the app moves focus on once the
 *           selection is empty (DataTable does).
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (UI contract, HeroUI v3 on web); ADR 0303 (decision 7); ADR 0318
 *          (decisions 4 to 6); ADR 0139 (action UX); WCAG 2.2 SC 2.4.3, 2.5.3, 2.5.8, 4.1.2, 4.1.3; owner decision 6 of
 *          STA-350 (thin wrappers).
 */
import { Toolbar, buttonVariants } from "@heroui/react";
import type { ComponentPropsWithoutRef } from "react";
import { Link as RouterLink } from "react-aria-components";

import type { BulkActionBarContractProps } from "#contracts/types/bulk-action-bar-contract-props.type";
import type { ResourceAction } from "#contracts/types/resource-action.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { pageActionVariant } from "#core/functions/page-action-variant.function";
import { usePendingActions } from "#react/bulk-action-bar/use-pending-actions";
import { Button } from "#react/button/button";
import { SlotIcon } from "#react/slot-icon/slot-icon";
import { Text } from "#react/text/text";

/**
 * Props of the web BulkActionBar: the shared contract plus the attributes of its root `div`, passed through. The
 * bar's own children are the actions, so the type refuses them.
 */
export type BulkActionBarProps = BulkActionBarContractProps &
  Omit<ComponentPropsWithoutRef<"div">, keyof BulkActionBarContractProps | "children">;

// shortcut: English until @stackra/i18n ships; then the keys `ui::bulk-action-bar.label`, `.selected`, `.clear`,
// `.select-all` and `.select-shown`.
const STRINGS = {
  label: "Bulk actions",
  selected: (count: number) => `${count} selected`,
  clear: "Clear selection",
  selectAll: (total: number) => `Select all ${total}`,
  selectShown: (count: number) => `Select only the ${count} shown`,
} as const;

/** The accessible name of an action: its text, then why it is refused when it is. */
function nameOf(action: ResourceAction): string | undefined {
  return action.isDisabled && action.disabledReason
    ? `${action.label}: ${action.disabledReason}`
    : undefined;
}

/**
 * The bar that appears over a table while records are selected: the count, the actions that act on the selection and a
 * way to clear it. The count is announced politely each time it changes.
 */
export function BulkActionBar({
  selectedCount,
  actions,
  onClearSelection,
  isPageSelected = false,
  totalCount,
  isAllMatchingSelected = false,
  onAllMatchingSelectedChange,
  label = STRINGS.label,
  countLabel = STRINGS.selected,
  clearLabel = STRINGS.clear,
  selectAllLabel = STRINGS.selectAll,
  selectShownLabel = STRINGS.selectShown,
  // Native only: web draws every action and has no overflow.
  moreActionsLabel: _moreActionsLabel,
  ...rest
}: BulkActionBarProps) {
  const { pending, run } = usePendingActions();
  // Choosing all matching makes the total the count; the keys are then only the rows on screen.
  const count = isAllMatchingSelected && totalCount !== undefined ? totalCount : selectedCount;
  const isShown = count > 0;
  const canChooseAll =
    onAllMatchingSelectedChange !== undefined &&
    totalCount !== undefined &&
    (isAllMatchingSelected || (isPageSelected && totalCount > selectedCount));

  return (
    <div {...rest}>
      {/* Present before it speaks, so a change of the count, not the bar's arrival, is what is announced. */}
      <div role="status" className="sr-only">
        {isShown ? countLabel(count) : ""}
      </div>
      {isShown ? (
        <Toolbar
          aria-label={label}
          className="flex flex-wrap items-center gap-2 rounded-lg bg-accent-soft p-2"
        >
          <Text type="small" className="px-2 font-medium">
            {countLabel(count)}
          </Text>
          {canChooseAll ? (
            <Button
              size="sm"
              variant="tertiary"
              onPress={() => onAllMatchingSelectedChange?.(!isAllMatchingSelected)}
            >
              {isAllMatchingSelected ? selectShownLabel(selectedCount) : selectAllLabel(totalCount)}
            </Button>
          ) : null}
          {actions.map((action, index) => {
            const variant = pageActionVariant(action, index === 0);
            const name = nameOf(action);
            if (action.href && !action.isDisabled) {
              return (
                <RouterLink
                  key={action.id}
                  href={action.href}
                  onPress={() => run(action.id, action.onPress)}
                  className={buttonVariants({ variant, size: "sm" })}
                >
                  <SlotIcon icon={action.icon} />
                  {action.label}
                </RouterLink>
              );
            }
            return (
              <Button
                key={action.id}
                size="sm"
                variant={variant}
                isLoading={pending.includes(action.id)}
                onPress={() => run(action.id, action.onPress)}
                {...omitUndefined({
                  isDisabled: action.isDisabled,
                  startIcon: action.icon,
                  label: name,
                })}
              >
                {action.label}
              </Button>
            );
          })}
          <Button size="sm" variant="ghost" onPress={onClearSelection}>
            {clearLabel}
          </Button>
        </Toolbar>
      ) : null}
    </div>
  );
}
