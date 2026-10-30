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
import { useState, type ReactElement } from "react";

import { useCursorPaginationState } from "#react/hooks/use-cursor-pagination-state";
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
              {...previous}
              startIcon={<Icon name="chevron-left" />}
            >
              {previousLabel}
            </Button>
            <Button
              size={size}
              variant="secondary"
              {...next}
              endIcon={<Icon name="chevron-right" />}
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
