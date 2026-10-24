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
import type { ComponentPropsWithoutRef } from "react";

import type { CursorPaginationContractProps } from "#contracts/types/cursor-pagination-contract-props.type";
import { Button } from "#react/button/button";
import { Icon } from "#react/icon/icon";
import { Text } from "#react/text/text";

// shortcut: English until @stackra/i18n ships; then the keys `ui::cursor-pagination.*`.
const STRINGS = {
  label: "Pagination",
  previous: "Previous",
  next: "Next",
  loadMore: "Load more",
  count: (count: number) => `Showing ${count} ${count === 1 ? "item" : "items"}`,
} as const;

/**
 * Props of the web CursorPagination: the shared contract plus the `nav` element's own props, passed through. The
 * element's `aria-label` is the contract's `label`, so the type refuses it.
 */
export type CursorPaginationProps = CursorPaginationContractProps &
  Omit<
    ComponentPropsWithoutRef<"nav">,
    keyof CursorPaginationContractProps | "aria-label" | "children"
  >;

/**
 * Previous and next buttons, or one load-more button, for a list that arrives in cursor pages. The next button is
 * disabled when the server has no `hasMore`, the previous one when the app has no earlier page, and both while a page
 * loads, so a double press never fetches twice.
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
  // A load-more form with nothing more to load and no count has nothing to draw: an empty landmark is noise.
  if (!isPager && !hasMore && count === undefined) return null;

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
              isDisabled={!hasPrevious || isLoading}
              onPress={onPrevious}
              startIcon={<Icon name="chevron-left" isMirroredInRtl />}
            >
              {previousLabel}
            </Button>
            <Button
              size={size}
              variant="secondary"
              isDisabled={!hasMore}
              isLoading={isLoading}
              onPress={onNext}
              endIcon={<Icon name="chevron-right" isMirroredInRtl />}
            >
              {nextLabel}
            </Button>
          </>
        ) : hasMore ? (
          <Button
            size={size}
            variant="secondary"
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
