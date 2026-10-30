/**
 * Stackra file contract:
 * Purpose: the web `TocRail`: an "On this page" navigation of anchor links with a start-edge marker on the section in
 *          view; uncontrolled, it follows the headings itself with an IntersectionObserver. `floating` puts it behind a
 *          round button fixed at the bottom end, in a popover.
 * Boundary: links stay real `#id` anchors; the page scrolls smoothly only without reduced motion and focus moves to
 *           the heading. The current entry carries `aria-current="location"`.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 2.4.5 and 2.4.8; STA-1371.
 */
import { cn } from "@heroui/react";
import { useReducedMotion } from "motion/react";
import { type MouseEvent, type ReactElement, useEffect, useState } from "react";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { IconButton } from "#react/icon-button/icon-button";
import { Popover } from "#react/popover/popover";
import type { TocRailProps } from "#react/toc-rail/toc-rail.props";

/** The id of the heading in view, followed with an IntersectionObserver while `isOn`. */
function useHeadingInView(ids: readonly string[], isOn: boolean): string | undefined {
  const [current, setCurrent] = useState<string | undefined>(ids[0]);
  const key = ids.join("|");
  useEffect(() => {
    if (!isOn || typeof IntersectionObserver === "undefined") return;
    const seen = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) seen.add(entry.target.id);
          else seen.delete(entry.target.id);
        }
        const first = ids.find((id) => seen.has(id));
        if (first) setCurrent(first);
      },
      { rootMargin: "0px 0px -60% 0px" },
    );
    for (const id of ids) {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- reason: `key` stands for `ids`, which a caller may rebuild on every render
  }, [key, isOn]);
  return current;
}

/** An "On this page" list. */
export function TocRail({
  items,
  activeId,
  onSelect,
  variant = "rail",
  label,
  className,
}: TocRailProps): ReactElement {
  const t = useUiText();
  const isReduced = useReducedMotion() ?? false;
  const followed = useHeadingInView(
    items.map((item) => item.id),
    activeId === undefined,
  );
  const current = activeId ?? followed;
  const name = label ?? t(UI_KEYS.ui.toc_rail.label);
  const go = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    const target = document.getElementById(id);
    if (target) {
      event.preventDefault();
      target.scrollIntoView({ behavior: isReduced ? "auto" : "smooth", block: "start" });
      if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
      history.replaceState(null, "", `#${id}`);
    }
    onSelect?.(id);
  };
  const list = (
    <nav aria-label={name} data-slot="toc-rail" className={cn("text-sm", className)}>
      <p aria-hidden className="m-0 mb-2 text-xs font-medium text-muted">
        {name}
      </p>
      <ol className="m-0 flex list-none flex-col border-s border-separator p-0">
        {items.map((item) => {
          const isCurrent = item.id === current;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={(event) => go(event, item.id)}
                aria-current={isCurrent ? "location" : undefined}
                className={cn(
                  "-ms-px block border-s-2 py-1 pe-2 no-underline outline-none transition-colors focus-visible:ring-2 focus-visible:ring-focus motion-reduce:transition-none",
                  item.level === 3 ? "ps-6" : "ps-3",
                  isCurrent
                    ? "border-accent font-medium text-foreground"
                    : "border-transparent text-muted hover:text-foreground",
                )}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
  if (variant === "rail") return list;
  return (
    <div className="fixed end-4 bottom-4 z-30">
      <Popover
        aria-label={name}
        placement="top"
        align="end"
        trigger={
          <IconButton
            icon="list"
            label={t(UI_KEYS.ui.toc_rail.open)}
            variant="secondary"
            className="rounded-full shadow-md"
          />
        }
      >
        <div className="max-h-[60vh] w-64 overflow-y-auto p-1">{list}</div>
      </Popover>
    </div>
  );
}
