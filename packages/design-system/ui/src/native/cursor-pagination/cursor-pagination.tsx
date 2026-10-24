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
import { useState } from "react";
import type { ViewProps } from "react-native";
import { View } from "react-native";

import type { CursorPaginationContractProps } from "#contracts/types/cursor-pagination-contract-props.type";
import { Button } from "#native/button/button";
import { Icon } from "#native/icon/icon";
import { Text } from "#native/text/text";

// shortcut: English until @stackra/i18n ships; then the keys `ui::cursor-pagination.*`.
const STRINGS = {
  label: "Pagination",
  previous: "Previous",
  next: "Next",
  loadMore: "Load more",
  count: (count: number) => `Showing ${count} ${count === 1 ? "item" : "items"}`,
} as const;

/**
 * Props of the native CursorPagination: the shared contract plus the `View`'s own props, passed through. The view's
 * `accessibilityLabel` is the contract's `label`, so the type refuses it.
 */
export type CursorPaginationProps = CursorPaginationContractProps &
  Omit<ViewProps, keyof CursorPaginationContractProps | "accessibilityLabel" | "children">;

/**
 * Previous and next buttons, or one load-more button, for a list that arrives in cursor pages. The next button is
 * disabled when the server has no `hasMore`, the previous one when the app has no earlier page. While a page loads
 * the button that was pressed shows the spinner and the other is disabled, so a double press never fetches twice.
 */
export function CursorPagination({
  hasMore,
  hasPrevious = false,
  onNext,
  onPrevious,
  mode = "pager",
  count,
  isLoading = false,
  size,
  label = STRINGS.label,
  previousLabel = STRINGS.previous,
  nextLabel = STRINGS.next,
  loadMoreLabel = STRINGS.loadMore,
  countLabel = STRINGS.count,
  className,
  ...rest
}: CursorPaginationProps) {
  const isPager = mode === "pager";
  // The button that was pressed shows the spinner, the other waits disabled; a load that no press started (an app's own
  // end-reached call) is the next page.
  const [pressed, setPressed] = useState<"previous" | "next">("next");
  const isPreviousLoading = isLoading && pressed === "previous";
  const isNextLoading = isLoading && pressed === "next";
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
              isDisabled={!hasPrevious || isNextLoading}
              isLoading={isPreviousLoading}
              onPress={() => {
                setPressed("previous");
                onPrevious?.();
              }}
              startIcon={<Icon name="chevron-left" isMirroredInRtl />}
            >
              {previousLabel}
            </Button>
            <Button
              variant="secondary"
              size={size}
              isDisabled={!hasMore || isPreviousLoading}
              isLoading={isNextLoading}
              onPress={() => {
                setPressed("next");
                onNext?.();
              }}
              endIcon={<Icon name="chevron-right" isMirroredInRtl />}
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
