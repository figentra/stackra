/**
 * Stackra file contract:
 * Purpose: the web `CursorPagination`: a navigation landmark with previous and next buttons (the `pager` form) or one
 *          load-more button (the `load-more` form), and a polite count of the items shown. It matches the server's
 *          cursor pages (`hasMore`, `nextCursor`): it holds no cursor, takes no page number and says no total.
 * Boundary: built on the `@stackra/ui` Button and Text; HeroUI v3 has a numbered Pagination, which needs a total a
 *          cursor page does not have, so this is the adapted form on its free parts (ADR 0302 decision 3). The only
 *          layout is a flex row with logical spacing. Every other prop passes through to the `nav` element.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0313 (decision 4); ADR 0060 (right-to-left);
 *          WCAG 2.2 SC 4.1.3.
 */
import { useState } from "react";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useUiText } from "#core/hooks/use-ui-text";
import { Button } from "#react/button/button";
import { Icon } from "#react/icon/icon";
import { Text } from "#react/text/text";
import type { CursorPaginationProps } from "#react/cursor-pagination/cursor-pagination.props";

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
  label,
  previousLabel,
  nextLabel,
  loadMoreLabel,
  countLabel,
  className,
  ...rest
}: CursorPaginationProps) {
  const t = useUiText();
  label ??= t(UI_KEYS.ui.cursor_pagination.label);
  previousLabel ??= t(UI_KEYS.ui.cursor_pagination.previous);
  nextLabel ??= t(UI_KEYS.ui.cursor_pagination.next);
  loadMoreLabel ??= t(UI_KEYS.ui.cursor_pagination.load_more);
  countLabel ??= (total) => t(UI_KEYS.ui.cursor_pagination.count, { count: total });
  const isPager = mode === "pager";
  // The button that was pressed shows the spinner, the other waits disabled; a load that no press started (an app's own
  // end-reached call) is the next page.
  const [pressed, setPressed] = useState<"previous" | "next">("next");
  const isPreviousLoading = isLoading && pressed === "previous";
  const isNextLoading = isLoading && pressed === "next";
  // The load-more button stays mounted, disabled, once the last page has arrived: if it unmounted while it had focus,
  // focus would fall to the page's body (WCAG 2.4.3).
  const [hadMore, setHadMore] = useState(hasMore);
  if (hasMore && !hadMore) setHadMore(true);
  // A load-more form that never had anything to load and no count has nothing to draw: an empty landmark is noise.
  if (!isPager && !hadMore && count === undefined) return null;

  return (
    <nav
      {...rest}
      aria-label={label}
      className={["flex flex-wrap items-center justify-between gap-3", className]
        .filter(Boolean)
        .join(" ")}
    >
      {count === undefined ? null : (
        // Rendered with the page, so only a later change is announced, and politely.
        <Text tone="muted" type="small" role="status">
          {countLabel(count)}
        </Text>
      )}
      <div className="flex items-center gap-2">
        {isPager ? (
          <>
            <Button
              size={size}
              variant="secondary"
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
              size={size}
              variant="secondary"
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
        ) : hadMore ? (
          <Button
            size={size}
            variant="secondary"
            isDisabled={!hasMore}
            isLoading={isLoading}
            onPress={onNext}
            startIcon="chevron-down"
          >
            {loadMoreLabel}
          </Button>
        ) : null}
      </div>
    </nav>
  );
}
