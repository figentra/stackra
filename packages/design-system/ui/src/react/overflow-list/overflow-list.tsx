/**
 * Stackra file contract:
 * Purpose: the web `OverflowList`: a row of chips that shows `maxVisible` of them and folds the rest into one
 *          "+N more" button, whose tooltip names the folded items; pressing it expands the row in place, and a "Show
 *          less" button folds it again. Each chip's text truncates past the chip's width while assistive technology
 *          still reads it whole. The row's height animates between folded and expanded.
 * Boundary: it keeps only whether it is expanded. The height animation is `motion`'s and stops under
 *           prefers-reduced-motion; the row's height follows a ResizeObserver, so a wrap after a resize is kept. The
 *           words come from the `ui` catalogue in the active locale.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0329 (motion layer); design-system gap
 *          inventory (2026-10-28) row 24; WCAG 2.2 SC 1.3.1, 4.1.2.
 */
import { cn } from "@heroui/react";
import { motion, useReducedMotion } from "motion/react";
import { useId, useLayoutEffect, useRef, useState, type ReactElement } from "react";
import { useLocale } from "react-aria-components";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { Button } from "#react/button/button";
import { Chip } from "#react/chip/chip";
import { useUiText } from "#react/hooks/use-ui-text";
import { Tooltip } from "#react/tooltip/tooltip";
import type { OverflowListProps } from "#react/overflow-list/overflow-list.props";

/** How long the height takes to follow a fold or an expand, in seconds. */
const EXPAND_SECONDS = 0.2;

/** Chips past `maxVisible` fold into "+N more"; pressing it expands the row. */
export function OverflowList({
  items,
  maxVisible = 3,
  label,
  defaultExpanded = false,
  size = "sm",
  tone = "default",
  className,
  ...rest
}: OverflowListProps): ReactElement {
  const t = useUiText();
  const { locale } = useLocale();
  const isReduced = useReducedMotion() ?? false;
  const [isExpanded, setExpanded] = useState(defaultExpanded);
  const [height, setHeight] = useState<number | "auto">("auto");
  const list = useRef<HTMLUListElement>(null);
  const listId = useId();
  const folded = items.slice(maxVisible);
  const shown = isExpanded || folded.length === 0 ? items : items.slice(0, maxVisible);

  // The outer box animates to the list's measured height, so the expand grows instead of jumping.
  useLayoutEffect(() => {
    const element = list.current;
    if (element === null) return;
    setHeight(element.offsetHeight);
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => setHeight(element.offsetHeight));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    // A plain root takes the caller's props; `motion.div` types its event props apart from React's.
    <div {...rest} className={cn("overflow-hidden", className)}>
      <motion.div
        initial={false}
        animate={{ height }}
        transition={{ duration: isReduced ? 0 : EXPAND_SECONDS }}
      >
        <ul
          ref={list}
          id={listId}
          aria-label={label}
          className="flex flex-wrap items-center gap-1.5"
        >
          {shown.map((item) => (
            <li key={item.id} className="max-w-48">
              <Chip size={size} tone={tone} className="max-w-full">
                <span className="min-w-0 truncate px-1">{item.label}</span>
              </Chip>
            </li>
          ))}
          {folded.length > 0 ? (
            <li>
              {isExpanded ? (
                <Button
                  variant="ghost"
                  size="sm"
                  aria-expanded
                  aria-controls={listId}
                  onPress={() => setExpanded(false)}
                >
                  {t(UI_KEYS.ui.overflow_list.less)}
                </Button>
              ) : (
                <Tooltip
                  content={new Intl.ListFormat(locale, { type: "conjunction" }).format(
                    folded.map((item) => item.label),
                  )}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-expanded={false}
                    aria-controls={listId}
                    onPress={() => setExpanded(true)}
                  >
                    {t(UI_KEYS.ui.overflow_list.more, { count: folded.length })}
                  </Button>
                </Tooltip>
              )}
            </li>
          ) : null}
        </ul>
      </motion.div>
    </div>
  );
}
