/**
 * Stackra file contract:
 * Purpose: the "On this page" table of contents of a component page (`tocItems`): each row an anchor link, nested
 *          rows indented, long titles and part names wrapping. As a `rail` (a wide screen) it is the sticky column:
 *          one continuous line on the start side with a single accent segment that slides to the row the reader is
 *          at (`aria-current="location"`, the scroll spy), the column scrolling itself to keep that row in view, and
 *          a "Back to top" link at its foot. As a `menu` (below `xl`) it is a disclosure at the top of the page that
 *          names the current section and opens to the same list. A row jumps by `scrollToSection`, so the mark goes
 *          straight to it and the address's hash changes without a history entry.
 * Boundary: links only; the anchors are set by the component page kit. The segment's slide is CSS (`.toc-list`), off
 *           unless `<html data-motion="full">`.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) sections 3.2 and 4; WCAG 2.2 SC 2.4.8.
 */
import { Icon, useCatalogueText } from "@stackra/ui/react";
import { useLayoutEffect, useRef, useState, type MouseEvent } from "react";

import { SHELL_KEYS } from "#src/components/playground-shell/shell-keys.constant";
import { tocItems } from "#src/components/toc-rail/toc-items.function";
import { scrollToSection } from "#src/components/toc-rail/scroll-to-section.function";
import { useActiveSection } from "#src/components/toc-rail/use-active-section";
import { MESSAGES } from "#src/constants/messages.constant";
import { SHOWCASE_KEYS } from "#src/constants/showcase-keys.constant";
import type { TocRailProps } from "#src/components/toc-rail/toc-rail.props";

/** Room kept above and below the active row when the rail scrolls to it, in px. */
const REVEAL_MARGIN = 32;

/** The table of contents, as the wide-screen rail or the narrow-screen menu. */
export function TocRail({ entry, className, variant = "rail" }: TocRailProps) {
  const t = useCatalogueText(MESSAGES.en);
  const items = tocItems(entry, t);
  // One spy writes the hash: the rail's, which is mounted at every width.
  const active = useActiveSection(
    items.map((item) => item.id),
    { syncHash: variant === "rail" },
  );
  const box = useRef<HTMLElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const menu = useRef<HTMLDetailsElement>(null);
  const [mark, setMark] = useState<{ top: number; height: number } | undefined>(undefined);
  const title = t(SHOWCASE_KEYS.showcase.ui.on_this_page);

  // The segment follows the active row (and its height, when a title wraps); the rail keeps that row in view.
  useLayoutEffect(() => {
    const ul = list.current;
    if (!ul) return;
    const place = () => {
      const link = ul.querySelector<HTMLElement>('[aria-current="location"]');
      setMark(link ? { top: link.offsetTop, height: link.offsetHeight } : undefined);
      const scroller = box.current;
      if (!link || !scroller || scroller.scrollHeight <= scroller.clientHeight) return;
      const view = scroller.getBoundingClientRect();
      const row = link.getBoundingClientRect();
      if (row.top < view.top + REVEAL_MARGIN)
        scroller.scrollBy({ top: row.top - view.top - REVEAL_MARGIN });
      else if (row.bottom > view.bottom - REVEAL_MARGIN)
        scroller.scrollBy({ top: row.bottom - view.bottom + REVEAL_MARGIN });
    };
    place();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(place);
    observer.observe(ul);
    return () => observer.disconnect();
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- the active section is the trigger: the segment and the scroll follow the lit row
  }, [active]);

  const jump = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    if (menu.current) menu.current.open = false;
    scrollToSection(id);
  };

  const rows = (
    <div className="toc-track">
      {mark ? (
        <span
          aria-hidden="true"
          className="toc-mark"
          style={{ transform: `translateY(${mark.top}px)`, height: mark.height }}
        />
      ) : null}
      <ul ref={list} className="toc-list">
        {items.map((item) => {
          const isActive = item.id === active;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                data-level={item.level}
                {...(isActive ? { "aria-current": "location" as const } : {})}
                className="toc-link"
                onClick={(event) => jump(event, item.id)}
              >
                {item.level === 3 && item.id.startsWith("api-") ? (
                  <bdi dir="ltr" className="font-mono text-xs">
                    {item.label}
                  </bdi>
                ) : (
                  item.label
                )}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );

  if (variant === "menu") {
    const current = items.find((item) => item.id === active)?.label;
    return (
      <nav aria-label={title} className={className}>
        <details ref={menu} className="toc-menu">
          <summary>
            <Icon name="list" size="sm" className="shrink-0 text-muted" />
            <span className="font-medium">{title}</span>
            {current ? <span className="min-w-0 flex-1 truncate text-muted">{current}</span> : null}
            <Icon name="chevron-down" size="sm" className="toc-menu__chevron ms-auto shrink-0" />
          </summary>
          <div className="toc-menu__body">{rows}</div>
        </details>
      </nav>
    );
  }

  return (
    <nav ref={box} aria-label={title} className={`toc-rail ${className ?? ""}`}>
      <p className="toc-rail__title">{title}</p>
      {rows}
      <a
        href="#main"
        className="toc-rail__top"
        onClick={(event) => {
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
          event.preventDefault();
          window.scrollTo({ top: 0 });
          document.querySelector<HTMLElement>("#main h1")?.focus({ preventScroll: true });
        }}
      >
        <Icon name="arrow-up" size="sm" className="shrink-0" />
        {t(SHELL_KEYS.shell.back_to_top)}
      </a>
    </nav>
  );
}
