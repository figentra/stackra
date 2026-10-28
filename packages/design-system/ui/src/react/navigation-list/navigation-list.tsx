/**
 * Stackra file contract:
 * Purpose: the web `NavigationList`: draws the contract's `items` as a named `nav` landmark holding nested lists. An
 *          item with `href` or `onPress` is a React Aria `Link` drawn as HeroUI's ghost button (so hover, press, focus
 *          ring and disabled state are HeroUI's), an item with only `children` is a group heading for the list under
 *          it, and the current place carries `aria-current` (`page`, or `true` on an entry that only holds it). The
 *          icon sits before the label and the badge (a Chip) after it; a `shortcut` is a tooltip.
 * Boundary: no router import: an `href` reaches the app's router through the nearest `RouterProvider`, the same seam as
 *           `Link`, and `isCurrent` is the app's to set (ADR 0317 decision 3). HeroUI has no navigation list, so this is
 *           the adapted form on its `buttonVariants` and a React Aria `Link`. The current entry is marked by a filled
 *           track, bold text and a bar at its start, so it does not rest on colour alone. Every group is open: a list of
 *           a console's size does not need folding, and a disclosure would hide places from the keyboard's tab order.
 *           `isCompact` is the Sidebar's icon rail: the label stays in the accessible name and leaves the sight, and the
 *           tooltip shows it. Each link carries `data-navigation-item` so AppShell's drawer can close when one is chosen.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decisions 1, 5 and 7); ADR 0317 (decisions 1, 3 and 5); ADR 0165
 *          (HeroUI v3 on web); WCAG 2.2 SC 1.3.1, 1.4.1, 2.4.7, 2.5.8 and 4.1.2.
 */
import { buttonVariants, cn } from "@heroui/react";
import { useId, type ReactElement } from "react";
import { Link as AriaLink } from "react-aria-components";

import type { NavigationItem } from "#contracts/types/navigation-item.type";
import { currentStateOf } from "#core/functions/current-state-of.function";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { Chip } from "#react/chip/chip";
import { SlotIcon } from "#react/slot-icon/slot-icon";
import { Tooltip } from "#react/tooltip/tooltip";
import type { NavigationListProps } from "#react/navigation-list/navigation-list.props";

/** A zero or empty badge draws nothing. */
function hasBadge(badge: NavigationItem["badge"]): badge is string | number {
  return badge !== undefined && badge !== 0 && badge !== "";
}

/** True when the entry is somewhere to go or something to run, and not only the heading of its children. */
function isLink(item: NavigationItem): boolean {
  return item.href !== undefined || item.onPress !== undefined;
}

/** What the entry's tooltip says: the label as well in the rail, where the label is not on screen. */
function tooltipOf(item: NavigationItem, isCompact: boolean): string | undefined {
  if (isCompact) return item.shortcut ? `${item.label} (${item.shortcut})` : item.label;
  return item.shortcut;
}

/** Props of {@link Entry}. */
interface EntryProps {
  /** The place to draw. */
  readonly item: NavigationItem;
  /** True for the icon rail. */
  readonly isCompact: boolean;
}

/** One link of the list. */
function Entry({ item, isCompact }: EntryProps): ReactElement {
  const state = currentStateOf(item);
  const isPage = state === "page";
  // Typed on its own so the literals survive the generic `omitUndefined` below, which would widen them to `string`.
  const ariaCurrent: "page" | "true" | undefined = isPage
    ? "page"
    : state === "ancestor"
      ? "true"
      : undefined;
  const link = (
    <AriaLink
      {...omitUndefined({
        // A disabled link is a span, which React Aria still hands the `href` attribute, so it is left off here.
        href: item.isDisabled ? undefined : item.href,
        onPress: item.onPress,
        isDisabled: item.isDisabled,
        "aria-current": ariaCurrent,
        "data-navigation-item": item.isDisabled ? undefined : "",
      })}
      className={
        cn(
          buttonVariants({ variant: "ghost" }),
          // HeroUI's button is a fixed-height pill that never wraps; a row is neither, so `md:h-auto` also resets the
          // desktop height, which a plain `h-auto` leaves in place. 40 px is well over the 24 px target size.
          "h-auto min-h-10 w-full justify-start gap-3 whitespace-normal rounded-xl px-3 py-2 text-start md:h-auto",
          // The current entry: a filled track, bold text and a bar at the start; the bar keeps it apart without colour.
          "data-[current=true]:font-semibold data-[current=true]:[--button-bg-hover:var(--default-hover)] data-[current=true]:[--button-bg-pressed:var(--default-hover)] data-[current=true]:[--button-bg:var(--default)]",
        ) ?? ""
      }
    >
      {isPage ? (
        // An element, not a ::before: axe cannot measure the contrast of text whose ancestor draws a pseudo-element.
        <span
          aria-hidden="true"
          className="absolute inset-y-2 start-0 w-1 rounded-full bg-accent"
        />
      ) : null}
      {item.icon === undefined ? (
        isCompact ? (
          // The rail has no room for the label, so an entry with no icon shows its first letter as a mark.
          <span aria-hidden="true" className="grid size-5 place-items-center text-sm font-semibold">
            {[...item.label][0]}
          </span>
        ) : null
      ) : (
        <SlotIcon icon={item.icon} />
      )}
      <span className={isCompact ? "sr-only" : "min-w-0 flex-1 truncate"}>{item.label}</span>
      {hasBadge(item.badge) ? (
        isCompact ? (
          <span className="sr-only">{item.badge}</span>
        ) : (
          <Chip size="sm" variant="primary" tone="accent">
            {item.badge}
          </Chip>
        )
      ) : null}
    </AriaLink>
  );
  const hint = tooltipOf(item, isCompact);
  return hint === undefined ? (
    link
  ) : (
    <Tooltip content={hint} placement="end">
      {link}
    </Tooltip>
  );
}

/** Props of {@link Items}. */
interface ItemsProps extends Pick<EntryProps, "isCompact"> {
  /** The entries of this level. */
  readonly items: readonly NavigationItem[];
  /** The nesting depth, 0 for the top level; a nested level is indented. */
  readonly depth: number;
  /** The id of the heading that names this level, for a nested level under a group. */
  readonly labelledBy?: string | undefined;
}

/** One level of entries as a list, each entry followed by its own nested level. */
function Items({ items, isCompact, depth, labelledBy }: ItemsProps): ReactElement {
  const groupId = useId();
  return (
    <ul
      {...omitUndefined({ "aria-labelledby": labelledBy })}
      // The rail is too narrow to indent, and a nested level there reads as one flat list of icons.
      className={cn("grid gap-1", depth > 0 && !isCompact ? "ms-4" : "")}
    >
      {items.map((item) => {
        const children = item.children ?? [];
        const headingId = `${groupId}-${item.id}`;
        return (
          <li key={item.id} className="relative grid gap-1">
            {isLink(item) ? (
              <Entry item={item} isCompact={isCompact} />
            ) : isCompact ? (
              <hr aria-hidden="true" className="mx-2 my-1 border-separator" />
            ) : (
              <span id={headingId} className="px-3 pt-3 pb-1 text-xs font-medium text-muted">
                {item.label}
              </span>
            )}
            {children.length === 0 ? null : (
              <Items
                items={children}
                isCompact={isCompact}
                depth={depth + 1}
                labelledBy={isLink(item) || isCompact ? undefined : headingId}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * The places of an app as a navigation landmark. Name it with `label` when the page holds more than one. The entry with
 * `isCurrent` is announced as the current page.
 */
export function NavigationList({
  items,
  label,
  isCompact = false,
  ...rest
}: NavigationListProps): ReactElement {
  const t = useUiText();
  label ??= t(UI_KEYS.ui.navigation_list.label);
  return (
    <nav {...rest} aria-label={label}>
      <Items items={items} isCompact={isCompact} depth={0} />
    </nav>
  );
}
