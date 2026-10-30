/**
 * Stackra file contract:
 * Purpose: the web `TabBar`, the mobile-web twin of the native one: up to five tabs across the bottom of a small
 *          screen, each an icon over its label with an optional count badge, the current one in the accent's soft
 *          label colour. Pinned to the viewport bottom below the `md` breakpoint (and hidden above it, where the
 *          Sidebar takes over), clearing the home indicator with the bottom safe-area inset.
 * Boundary: a `nav` landmark named by `label`; each tab is a React Aria `Link` (an `href` reaches the app's router
 *           through the nearest `RouterProvider`) or a button for `onPress` only, the current one `aria-current="page"`,
 *           its name holding the badge ("Orders, 3"). Each tab is at least 56 px high. The row follows the reading
 *           direction.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0317 (decision 7); ADR 0060; WCAG 2.2 SC 1.3.1, 2.4.8, 2.5.8 and 4.1.2;
 *          STA-1371.
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";
import { Link } from "react-aria-components";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { currentStateOf } from "#core/functions/current-state-of.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { SlotIcon } from "#react/slot-icon/slot-icon";
import type { TabBarProps } from "#react/tab-bar/tab-bar.props";

/** A bottom bar of up to five tabs. */
export function TabBar({ items, label, position = "fixed", className }: TabBarProps): ReactElement {
  const t = useUiText();
  return (
    <nav
      aria-label={label ?? t(UI_KEYS.ui.tab_bar.label)}
      data-slot="tab-bar"
      className={cn(
        "border-t border-separator bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur",
        position === "fixed" && "fixed inset-x-0 bottom-0 z-40 md:hidden",
        className,
      )}
    >
      <ul className="m-0 flex list-none p-0">
        {items.slice(0, 5).map((item) => {
          const isCurrent = currentStateOf(item) !== "none";
          const name = item.badge === undefined ? item.label : `${item.label}, ${item.badge}`;
          return (
            <li key={item.id} className="min-w-0 flex-1">
              <Link
                aria-label={name}
                {...(isCurrent ? { "aria-current": "page" as const } : {})}
                {...(item.href && !item.isDisabled ? { href: item.href } : {})}
                {...(item.onPress ? { onPress: item.onPress } : {})}
                isDisabled={item.isDisabled ?? false}
                className={
                  cn(
                    "flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-[var(--radius-control)] px-1 text-xs outline-none",
                    "focus-visible:outline-2 focus-visible:outline-focus data-[disabled]:opacity-50",
                    isCurrent
                      ? "font-medium text-accent-soft-foreground"
                      : "text-muted hover:text-foreground",
                  ) ?? ""
                }
              >
                <span
                  aria-hidden
                  className="relative flex size-6 items-center justify-center [&_svg]:size-5"
                >
                  <SlotIcon icon={item.icon} />
                  {item.badge === undefined ? null : (
                    // The count is drawn by CSS: as text it sits before the label, so the visible text no longer
                    // matched the name "Orders, 3" (axe label-content-name-mismatch).
                    <span
                      data-count={item.badge}
                      className="absolute -end-2 -top-1 min-w-4 rounded-[var(--radius-pill)] bg-danger px-1 text-center text-[0.625rem] leading-4 font-semibold text-danger-foreground tabular-nums before:content-[attr(data-count)]"
                    />
                  )}
                </span>
                <span aria-hidden className="max-w-full truncate">
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
