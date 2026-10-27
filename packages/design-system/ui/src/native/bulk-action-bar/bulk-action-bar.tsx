/**
 * Stackra file contract:
 * Purpose: the native `BulkActionBar`, the adapted form of ADR 0302 (decision 3) and ADR 0318 (decision 10): a bottom
 *          bar on the contract of the web one (`selectedCount`, `actions`, `onClearSelection`, `isPageSelected`,
 *          `totalCount`, `isAllMatchingSelected`, `onAllMatchingSelectedChange` and the spoken names) that shows the
 *          count, the "select all N" choice, the first two actions as buttons and a clear button, and puts every action
 *          after them in an inset action sheet that a "more" button opens. Every other `View` prop passes through.
 * Boundary: no styling of its own beyond the bar's card layout. The bar is drawn only while something is selected, and
 *           the count is announced through `AccessibilityInfo.announceForAccessibility` each time it changes, which
 *           stands in for the web's polite live region. An action is busy while its promise is pending and refuses a
 *           second tap (`usePendingActions`); the "more" button is busy while any action in the sheet is. The sheet is the
 *           native `Drawer`, which is HeroUI Native's inset bottom sheet (owner decision of 2026-10-24); choosing an
 *           action closes it, and a long-running action is then seen on the "more" button. An action with an `href` goes
 *           to the nearest `RouterProvider` for an app path and to the system browser otherwise, after its `onPress`. A
 *           disabled action refuses the tap and says why in its accessible name. Strings are always wrapped in `Text`,
 *           which React Native requires.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (HeroUI Native on native); ADR 0303 (decision 7); ADR 0318
 *          (decisions 4 to 6 and 10); ADR 0139 (action UX); ADR 0060 (right-to-left); WCAG 2.2 SC 2.5.8, 4.1.2, 4.1.3;
 *          owner decision 6 of STA-350 (thin wrappers).
 */
import { use, useEffect, useState } from "react";
import { AccessibilityInfo, View } from "react-native";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import type { ResourceAction } from "#contracts/types/resource-action.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { pageActionVariant } from "#core/functions/page-action-variant.function";
import { usePendingActions } from "#native/bulk-action-bar/use-pending-actions";
import { Button } from "#native/button/button";
import { Drawer } from "#native/drawer/drawer";
import { IconButton } from "#native/icon-button/icon-button";
import { followHref } from "#native/router-provider/follow-href.function";
import { RouterContext } from "#native/router-provider/router-context";
import { Text } from "#native/text/text";
import type { BulkActionBarProps } from "#native/bulk-action-bar/bulk-action-bar.props";

// Developer log text, read in the console only, so it stays English (ADR 0080 translates what users see).
const COULD_NOT_OPEN = "Bulk action bar could not open the link of an action";

/** How many actions sit in the bar itself; a phone's width holds two beside the count and the clear button. */
const VISIBLE_ACTIONS = 2;

/** The accessible name of an action: its text, then why it is refused when it is. */
function nameOf(action: ResourceAction): string | undefined {
  return action.isDisabled && action.disabledReason
    ? `${action.label}: ${action.disabledReason}`
    : undefined;
}

/**
 * The bar that appears at the foot of a list while records are selected: the count, the first actions on the selection,
 * a way to clear it and a sheet for the rest. The count is announced each time it changes.
 */
export function BulkActionBar({
  selectedCount,
  actions,
  onClearSelection,
  isPageSelected = false,
  totalCount,
  isAllMatchingSelected = false,
  onAllMatchingSelectedChange,
  label,
  countLabel,
  clearLabel,
  selectAllLabel,
  selectShownLabel,
  moreActionsLabel,
  className,
  ...rest
}: BulkActionBarProps) {
  const t = useUiText();
  const keys = UI_KEYS.ui.bulk_action_bar;
  label ??= t(keys.label);
  countLabel ??= (count) => t(keys.selected, { count });
  clearLabel ??= t(keys.clear);
  selectAllLabel ??= (total) => t(keys.select_all, { total });
  selectShownLabel ??= (count) => t(keys.select_shown, { count });
  moreActionsLabel ??= t(keys.more_actions);
  const navigate = use(RouterContext);
  const { pending, run } = usePendingActions();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  // Choosing all matching makes the total the count; the keys are then only the rows on screen.
  const count = isAllMatchingSelected && totalCount !== undefined ? totalCount : selectedCount;
  const countText = count > 0 ? countLabel(count) : "";
  // The sentence, not the count, is the dependency, so a caller's inline `countLabel` does not announce on every render.
  useEffect(() => {
    if (countText !== "") AccessibilityInfo.announceForAccessibility(countText);
  }, [countText]);
  if (count === 0) return null;

  const canChooseAll =
    onAllMatchingSelectedChange !== undefined &&
    totalCount !== undefined &&
    (isAllMatchingSelected || (isPageSelected && totalCount > selectedCount));
  const shown = actions.slice(0, VISIBLE_ACTIONS);
  const overflow = actions.slice(VISIBLE_ACTIONS);

  const choose = (action: ResourceAction) => {
    run(action.id, action.onPress);
    if (action.href) followHref(action.href, navigate, COULD_NOT_OPEN);
  };

  const buttonFor = (action: ResourceAction, index: number, onChoose: () => void) => (
    <Button
      key={action.id}
      size="sm"
      variant={pageActionVariant(action, index === 0)}
      isLoading={pending.includes(action.id)}
      onPress={onChoose}
      {...omitUndefined({
        isDisabled: action.isDisabled,
        startIcon: action.icon,
        label: nameOf(action),
      })}
    >
      {action.label}
    </Button>
  );

  return (
    <View
      {...rest}
      role="toolbar"
      accessibilityLabel={label}
      className={`flex-row flex-wrap items-center gap-2 rounded-2xl bg-accent-soft p-3 ${className ?? ""}`}
    >
      <Text type="small" className="px-1 font-medium">
        {countText}
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
      {shown.map((action, index) => buttonFor(action, index, () => choose(action)))}
      {overflow.length === 0 ? null : (
        <>
          <IconButton
            icon="ellipsis"
            label={moreActionsLabel}
            variant="secondary"
            size="sm"
            isLoading={overflow.some((action) => pending.includes(action.id))}
            onPress={() => setIsMoreOpen(true)}
          />
          <Drawer isOpen={isMoreOpen} onOpenChange={setIsMoreOpen}>
            <Drawer.Header>
              <Drawer.Title>{moreActionsLabel}</Drawer.Title>
              <Drawer.Close label={t(UI_KEYS.ui.bulk_action_bar.close)} />
            </Drawer.Header>
            <Drawer.Body>
              {overflow.map((action) => (
                // A full-width row in the sheet; choosing it closes the sheet first, so the tap is never lost behind it.
                <Button
                  key={action.id}
                  variant={pageActionVariant(action, false)}
                  isFullWidth
                  isLoading={pending.includes(action.id)}
                  onPress={() => {
                    setIsMoreOpen(false);
                    choose(action);
                  }}
                  {...omitUndefined({
                    isDisabled: action.isDisabled,
                    startIcon: action.icon,
                    label: nameOf(action),
                  })}
                >
                  {action.label}
                </Button>
              ))}
            </Drawer.Body>
          </Drawer>
        </>
      )}
      <Button size="sm" variant="ghost" onPress={onClearSelection}>
        {clearLabel}
      </Button>
    </View>
  );
}
