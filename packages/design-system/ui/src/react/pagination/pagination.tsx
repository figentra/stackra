/**
 * Stackra file contract:
 * Purpose: the web `Pagination` on HeroUI v3's Pagination: a "1–10 of 240" summary, previous, numbered pages with gaps
 *          and next, and optionally a page-size Select and a "Go to page" number input.
 * Boundary: a `nav` landmark named by `label`; the current page carries `aria-current="page"`; each number button is
 *           named "Page 3". Numbers follow the customer's digits; the chevrons mirror in right-to-left.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 1.3.1, 2.4.6 and 2.5.8; STA-1371.
 */
import { Pagination as HeroPagination, cn } from "@heroui/react";
import { useState, type ReactElement } from "react";

import { DISPLAY_KEYS } from "#core/constants/display-keys.constant";
import { pageItemsOf } from "#core/functions/page-items-of.function";
import { Button } from "#react/button/button";
import { usePaginationState } from "#react/hooks/use-pagination-state";
import { useNumberFormat } from "#react/hooks/use-number-format";
import { useUiText } from "#react/hooks/use-ui-text";
import { Icon } from "#react/icon/icon";
import { NumberField } from "#react/number-field/number-field";
import type { PaginationProps } from "#react/pagination/pagination.props";
import { Select } from "#react/select/select";

/** The pagination's keys. */
const K = DISPLAY_KEYS.ui.pagination;

/** Numbered pages over a known total. */
export function Pagination(props: PaginationProps): ReactElement {
  const {
    total,
    pageSizes,
    hasJump = false,
    hasSummary = true,
    siblings = 1,
    label,
    className,
  } = props;
  const t = useUiText();
  const format = useNumberFormat();
  const { current, size, pageCount, from, to, go, resize } = usePaginationState(props);
  const [jump, setJump] = useState<number | null>(null);
  return (
    <div
      data-slot="pagination"
      className={cn("flex flex-wrap items-center justify-between gap-x-4 gap-y-3", className)}
    >
      {hasSummary ? (
        <span className="text-sm text-muted tabular-nums">
          {t(K.summary, { from: format(from), to: format(to), total: format(total) })}
        </span>
      ) : null}
      <HeroPagination aria-label={label ?? t(K.label)}>
        <HeroPagination.Content>
          <HeroPagination.Item>
            <HeroPagination.Previous
              aria-label={t(K.previous)}
              isDisabled={current <= 1}
              onPress={() => go(current - 1)}
            >
              <Icon name="chevron-left" size="sm" />
            </HeroPagination.Previous>
          </HeroPagination.Item>
          {pageItemsOf(current, pageCount, siblings).map((item, index) => (
            <HeroPagination.Item key={item === "ellipsis" ? `gap-${index}` : item}>
              {item === "ellipsis" ? (
                <HeroPagination.Ellipsis />
              ) : (
                <HeroPagination.Link
                  isActive={item === current}
                  aria-label={t(K.page, { page: format(item) })}
                  onPress={() => go(item)}
                  className="tabular-nums"
                >
                  {format(item)}
                </HeroPagination.Link>
              )}
            </HeroPagination.Item>
          ))}
          <HeroPagination.Item>
            <HeroPagination.Next
              aria-label={t(K.next)}
              isDisabled={current >= pageCount}
              onPress={() => go(current + 1)}
            >
              <Icon name="chevron-right" size="sm" />
            </HeroPagination.Next>
          </HeroPagination.Item>
        </HeroPagination.Content>
      </HeroPagination>
      {pageSizes?.length || hasJump ? (
        <div className="flex flex-wrap items-end gap-3">
          {pageSizes?.length ? (
            <Select
              label={t(K.per_page)}
              isFullWidth={false}
              items={pageSizes.map((option) => ({ id: String(option), label: format(option) }))}
              value={String(size)}
              onChange={(key) => {
                if (key) resize(Number(key));
              }}
            />
          ) : null}
          {hasJump ? (
            <form
              className="flex items-end gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                if (jump !== null) go(jump);
                setJump(null);
              }}
            >
              <NumberField
                label={t(K.jump)}
                value={jump}
                onChange={setJump}
                minValue={1}
                maxValue={pageCount}
                hasSteppers={false}
                isFullWidth={false}
                className="w-24"
              />
              <Button type="submit" variant="secondary">
                {t(K.go)}
              </Button>
            </form>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
