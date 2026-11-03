/**
 * Stackra file contract:
 * Purpose: the web `SectionDock`: the sticky bottom bar of a blueprint page. It links to each section, follows the one
 *          in view with an IntersectionObserver (the current link filled in the accent) and narrates it in a mono
 *          status line, as the CLI would (Arabic in the Arabic body face). Under `md` only the current link shows; the
 *          others stay in the accessibility tree and appear while focused.
 * Boundary: a navigation landmark of real `#id` links; the current one carries `aria-current="location"`, which is
 *           the signal for assistive tech. The status line changes only when the current section does and is not a
 *           live region, so scrolling announces nothing. Logical sides only, so right-to-left mirrors it. Nothing
 *           moves on its own; the browser scrolls to a link.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0501 (section 9, the blueprint roles); ADR 0060 (right-to-left);
 *          WCAG 2.2 SC 2.4.5, 2.4.7 and 2.4.8; STA-2041.
 */
import { cn } from "@heroui/react";
import { type ReactElement, useEffect, useState } from "react";

import type { SectionDockProps } from "#react/section-dock/section-dock.props";

/** A dock of the page's sections. */
export function SectionDock({ label, items, className }: SectionDockProps): ReactElement {
  const [currentId, setCurrentId] = useState<string | undefined>(items[0]?.id);
  // The ids' content, so a caller rebuilding the items on every render does not re-observe.
  const key = items.map((item) => item.id).join("|");

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return undefined;
    const ids = key.split("|");
    const seen = new Set<string>();
    // The current section is the first, in reading order, that crosses the top 40% of the viewport.
    const sight = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) seen.add(entry.target.id);
          else seen.delete(entry.target.id);
        }
        const first = ids.find((id) => seen.has(id));
        if (first) setCurrentId(first);
      },
      { rootMargin: "0px 0px -60% 0px" },
    );
    for (const id of ids) {
      const section = document.getElementById(id);
      if (section) sight.observe(section);
    }
    return () => sight.disconnect();
  }, [key]);

  const current = items.find((item) => item.id === currentId) ?? items[0];
  return (
    <nav
      aria-label={label}
      data-slot="section-dock"
      className={cn(
        "material-role-toolbar sticky bottom-0 z-(--z-dock) flex h-(--blueprint-dock-height) items-center gap-4 px-4 [border-block-start:var(--blueprint-rule-width)_solid_var(--blueprint-rule)]",
        className,
      )}
    >
      <ol className="m-0 flex min-w-0 list-none items-center gap-1 p-0">
        {items.map((item) => {
          const isCurrent = item.id === current?.id;
          return (
            // Under md the other links are visually hidden, not removed: a screen reader still lists them, and a
            // keyboard or switch user tabbing onto one sees it appear while it has focus.
            <li
              key={item.id}
              className={cn(!isCurrent && "max-md:sr-only max-md:focus-within:not-sr-only")}
            >
              <a
                href={`#${item.id}`}
                aria-current={isCurrent ? "location" : undefined}
                className={cn(
                  "block whitespace-nowrap rounded-[var(--radius-pill)] px-2.5 py-1 text-xs no-underline outline-none focus-visible:ring-2 focus-visible:ring-focus",
                  isCurrent
                    ? "bg-accent text-accent-foreground"
                    : "text-muted hover:text-foreground",
                )}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ol>
      {/* Not a live region: scrolling would read out every section passed; `aria-current` already says where you
          are. Mono is the CLI voice, so Arabic words take the Arabic body face instead of a system fallback. */}
      <p
        data-slot="section-dock-status"
        className="m-0 ms-auto min-w-0 truncate font-mono text-xs text-muted [&:lang(ar)]:[font-family:var(--font-arabic)]"
      >
        {current?.status ?? ""}
      </p>
    </nav>
  );
}
