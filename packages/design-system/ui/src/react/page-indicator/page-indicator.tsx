/**
 * Stackra file contract:
 * Purpose: the web `PageIndicator`: the dots under a carousel or an onboarding pager, the current one stretched into
 *          a bar. With `onChange` each dot is a button with a 24px target that goes to its page and the current one
 *          is `aria-current`; without, the row is one image named "Page 2 of 5".
 * Boundary: the stretch is a CSS width transition, off under reduced motion. The row follows the page direction, so
 *           page one is at the right in Arabic.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 1.1.1, 2.3.3 and 2.5.8;
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";

import { LONG_TAIL_KEYS } from "#core/constants/long-tail-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import type { PageIndicatorProps } from "#react/page-indicator/page-indicator.props";

/** The indicator's words. */
const K = LONG_TAIL_KEYS.ui.page_indicator;

/** One dot: long when current. */
const dotClass = (isCurrent: boolean) =>
  cn(
    "block h-2 rounded-[var(--radius-pill)] transition-[width,background-color] duration-(--duration-moderate) motion-reduce:transition-none",
    isCurrent ? "w-5 bg-foreground" : "w-2 bg-default",
  );

/** The dots under a carousel or pager, the current page stretched. */
export function PageIndicator({
  count,
  index,
  onChange,
  label,
  getPageLabel,
  className,
}: PageIndicatorProps): ReactElement {
  const t = useUiText();
  const nameOf = (page: number) => getPageLabel?.(page, count) ?? t(K.page, { index: page, count });
  const pages = Array.from({ length: count }, (_, page) => page);
  if (!onChange) {
    return (
      <div
        role="img"
        aria-label={nameOf(index + 1)}
        data-slot="page-indicator"
        className={cn("flex items-center gap-1.5", className)}
      >
        {pages.map((page) => (
          <span key={page} className={dotClass(page === index)} />
        ))}
      </div>
    );
  }
  return (
    <div
      role="group"
      aria-label={label ?? t(K.pages)}
      data-slot="page-indicator"
      className={cn("flex items-center", className)}
    >
      {pages.map((page) => (
        <button
          key={page}
          type="button"
          aria-label={nameOf(page + 1)}
          aria-current={page === index ? "true" : undefined}
          onClick={() => onChange(page)}
          className="group grid h-6 min-w-6 place-items-center rounded-[var(--radius-pill)] outline-none"
        >
          <span
            aria-hidden="true"
            className={cn(
              dotClass(page === index),
              "group-focus-visible:ring-2 group-focus-visible:ring-focus",
            )}
          />
        </button>
      ))}
    </div>
  );
}
