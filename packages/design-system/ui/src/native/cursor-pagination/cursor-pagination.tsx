/**
 * Stackra file contract:
 * Purpose: the native `CursorPagination`: the same previous and next buttons (the `pager` form) or one load-more
 *          button (the `load-more` form), and the count of items shown, as the web component draws them. It matches the
 *          server's cursor pages (`hasMore`): it holds no cursor and says no total.
 * Boundary: built on the native `Button` and `Text` over a plain `View`; HeroUI Native has no pagination, so this is
 *          the adapted form on its free parts (ADR 0302 decision 3). An app that loads the next page when its list
 *          reaches the end calls the same `onNext` from its list's end-reached callback, and may leave this out. Every
 *          other prop passes through to the `View`.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0313 (decisions 4 and 7); ADR 0060
 *          (right-to-left).
 */
import type { ReactElement } from "react";
import { View } from "react-native";

import { useCursorPaginationState } from "#react/hooks/use-cursor-pagination-state";
import { Button } from "#native/button/button";
import { Icon } from "#native/icon/icon";
import { Text } from "#native/text/text";
import type { CursorPaginationProps } from "#native/cursor-pagination/cursor-pagination.props";

/**
 * Previous and next buttons, or one load-more button, for a list that arrives in cursor pages. The next button is
 * disabled when the server has no `hasMore`, the previous one when the app has no earlier page. While a page loads
 * the button that was pressed shows the spinner and the other is disabled, so a double press never fetches twice.
 */
export function CursorPagination({
  hasMore,
  hasPrevious,
  onNext,
  onPrevious,
  mode,
  count,
  isLoading = false,
  size,
  label: labelProp,
  previousLabel: previousLabelProp,
  nextLabel: nextLabelProp,
  loadMoreLabel: loadMoreLabelProp,
  countLabel: countLabelProp,
  className,
  ...rest
}: CursorPaginationProps): ReactElement | null {
  const { label, previousLabel, nextLabel, loadMoreLabel, countLabel, isPager, previous, next } =
    useCursorPaginationState({
      hasMore,
      hasPrevious,
      onNext,
      onPrevious,
      mode,
      isLoading,
      label: labelProp,
      previousLabel: previousLabelProp,
      nextLabel: nextLabelProp,
      loadMoreLabel: loadMoreLabelProp,
      countLabel: countLabelProp,
    });
  // A load-more form with nothing more to load and no count has nothing to draw.
  if (!isPager && !hasMore && count === undefined) return null;

  return (
    <View
      {...rest}
      accessibilityRole="toolbar"
      accessibilityLabel={label}
      className={["flex-row flex-wrap items-center justify-between gap-3", className]
        .filter(Boolean)
        .join(" ")}
    >
      {count === undefined ? null : (
        <Text tone="muted" type="small" accessibilityLiveRegion="polite">
          {countLabel(count)}
        </Text>
      )}
      <View className="flex-row items-center gap-2">
        {isPager ? (
          <>
            <Button
              variant="secondary"
              size={size}
              {...previous}
              startIcon={<Icon name="chevron-left" />}
            >
              {previousLabel}
            </Button>
            <Button
              variant="secondary"
              size={size}
              {...next}
              endIcon={<Icon name="chevron-right" />}
            >
              {nextLabel}
            </Button>
          </>
        ) : hasMore ? (
          <Button
            variant="secondary"
            size={size}
            isLoading={isLoading}
            onPress={onNext}
            startIcon="chevron-down"
          >
            {loadMoreLabel}
          </Button>
        ) : null}
      </View>
    </View>
  );
}
