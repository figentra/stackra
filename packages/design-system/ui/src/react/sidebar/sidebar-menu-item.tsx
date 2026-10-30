/**
 * Stackra file contract:
 * Purpose: the web `Sidebar.MenuItem`: one place in a sidebar menu. The row holds the icon, the label, a badge or a
 *          shortcut, and an optional action that shows on hover and focus. The active place is a soft accent fill with
 *          the accent's own text colour (`accent-soft-foreground`, which keeps its contrast on every brand), medium
 *          weight and a bar at its start edge, so it never rests on colour alone; it is announced with
 *          `aria-current="page"`. Nested entries (children) form a sub-menu under an indent guide, folded by a chevron
 *          (or by the whole row when the entry leads nowhere itself); it opens on its own when it holds the active
 *          place, and the entry is then marked `aria-current="true"`. In the icon rail the label leaves the sight but
 *          stays the spoken name and becomes a tooltip, a badge becomes a dot on the icon, an entry with no icon shows a
 *          monogram, the sub-menu and the action hide, and a folding entry pressed there expands the sidebar to show
 *          its sub-menu.
 * Boundary: the row is a React Aria `Link` (an `href` reaches the app's router through `RouterProvider`, the house
 *           Link's seam) or a React Aria `Button` for an entry that only folds; HeroUI has no sidebar entry. The tooltip
 *           is always mounted and disabled outside the rail, so collapsing never remounts the row and focus stays on it.
 *           Each row carries `data-navigation-item` (AppShell's drawer closes on it) and `data-sidebar-focus` (the arrow
 *           keys of `Sidebar.Content`).
 * Runtime: browser
 * Governing contract: ADR 0305; ADR 0303 (decisions 1 and 7); ADR 0317 (decision 3); WCAG 2.2 SC 1.3.1, 1.4.1, 1.4.3,
 *          1.4.11, 2.4.7, 2.5.8 and 4.1.2; owner request 2026-10-29 (STA-1371).
 */
import { cn, Kbd } from "@heroui/react";
import { use, useId, useLayoutEffect, useRef, useState, type ReactElement } from "react";
import { Button as AriaButton, Link as AriaLink } from "react-aria-components";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { initialsOf } from "#core/functions/initials-of.function";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { Chip } from "#react/chip/chip";
import { Icon } from "#react/icon/icon";
import { SidebarContext } from "#react/sidebar/sidebar-context";
import { SidebarMenuDepthContext } from "#react/sidebar/sidebar-menu-depth-context";
import type { SidebarMenuItemProps } from "#react/sidebar/sidebar-menu-item.props";
import { SlotIcon } from "#react/slot-icon/slot-icon";
import { Tooltip } from "#react/tooltip/tooltip";

/** The row's look; `data-active` is the place the user is on, `data-ancestor` an entry that holds it. */
const ROW = [
  "relative flex w-full min-w-0 items-center gap-3 rounded-[var(--radius-control)] px-3 text-start text-sm text-foreground outline-none",
  "transition-colors motion-reduce:transition-none",
  "hover:bg-default focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus",
  "data-[pressed=true]:bg-default",
  "data-[active=true]:bg-accent-soft data-[active=true]:font-medium data-[active=true]:text-accent-soft-foreground",
  "data-[ancestor=true]:font-medium",
  "data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-50 data-[disabled=true]:hover:bg-transparent",
].join(" ");

/** A zero or empty badge draws nothing. */
const hasBadge = (badge: SidebarMenuItemProps["badge"]): badge is string | number =>
  badge !== undefined && badge !== 0 && badge !== "";

/** One place of a sidebar menu. */
export function SidebarMenuItem({
  label,
  icon,
  href,
  onPress,
  isActive = false,
  isDisabled = false,
  badge,
  shortcut,
  action,
  isOpen,
  defaultOpen,
  onOpenChange,
  children,
  className,
  ...rest
}: SidebarMenuItemProps): ReactElement {
  const t = useUiText();
  const sidebar = use(SidebarContext);
  const isRail = sidebar?.isRail ?? false;
  const depth = use(SidebarMenuDepthContext);
  const subId = useId();
  const subRef = useRef<HTMLUListElement>(null);
  const hasSub = children !== undefined && children !== null && children !== false;
  const [hasActiveChild, setHasActiveChild] = useState(false);
  const [ownOpen, setOwnOpen] = useState(defaultOpen ?? false);
  const open = isOpen ?? ownOpen;
  const setOpen = (next: boolean) => {
    setOwnOpen(next);
    onOpenChange?.(next);
  };

  // The sub-menu stays in the page while folded, so whether it holds the active place is read from it after each
  // render; the first time it does, an uncontrolled sub-menu opens to show it.
  // oxlint-disable-next-line react-hooks/exhaustive-deps -- runs after every render on purpose; it sets state only on a change
  useLayoutEffect(() => {
    const found = subRef.current?.querySelector('[aria-current="page"]') != null;
    if (found === hasActiveChild) return;
    setHasActiveChild(found);
    if (found && isOpen === undefined && defaultOpen === undefined) setOwnOpen(true);
  });

  const isLink = href !== undefined || onPress !== undefined;
  const isNested = depth > 0;
  const showBadge = hasBadge(badge);
  const rowClass = cn(
    ROW,
    isNested ? "min-h-8" : "min-h-9",
    isRail ? "justify-center gap-0 px-0" : "",
    // Room for the action and the sub-menu's chevron, which sit over the row's end.
    isRail
      ? ""
      : ["", "pe-9", "pe-16"][(action === undefined ? 0 : 1) + (hasSub && isLink ? 1 : 0)],
  );
  // In the rail the sub-menu is out of sight, so an entry holding the active place is drawn as the active place.
  const isLit = isActive || (isRail && hasActiveChild);
  const state = {
    "data-active": isLit ? "true" : undefined,
    "data-ancestor": !isLit && hasActiveChild ? "true" : undefined,
  };
  // Typed on its own so the literals survive the generic `omitUndefined`, which would widen them to `string`.
  const ariaCurrent: "page" | "true" | undefined = isActive
    ? "page"
    : hasActiveChild
      ? "true"
      : undefined;

  const content = (
    <>
      {isLit ? (
        // An element, not a ::before: axe cannot measure the contrast of text whose ancestor draws a pseudo-element.
        <span
          aria-hidden="true"
          className="absolute inset-y-1.5 start-0 w-[3px] rounded-full bg-current"
        />
      ) : null}
      {icon === undefined && (isNested || !isRail) ? null : (
        <span aria-hidden="true" className="relative grid size-5 shrink-0 place-items-center">
          {icon === undefined ? (
            <span className="grid size-5 place-items-center rounded-[var(--radius-control)] bg-default text-[0.625rem] font-semibold">
              {initialsOf(label)}
            </span>
          ) : (
            <SlotIcon icon={icon} />
          )}
          {isRail && showBadge ? (
            <span className="absolute -end-1 -top-1 size-2 rounded-full bg-accent ring-2 ring-surface" />
          ) : null}
        </span>
      )}
      <span className={isRail ? "sr-only" : "min-w-0 flex-1 truncate"}>{label}</span>
      {showBadge ? (
        isRail ? (
          <span className="sr-only">{` (${badge})`}</span>
        ) : (
          <Chip size="sm" variant="soft" tone="accent" className="shrink-0">
            {badge}
          </Chip>
        )
      ) : null}
      {shortcut !== undefined && !isRail && !showBadge ? (
        // One key cap per key, so `G O` reads as two keys and not as one word.
        <span className="flex shrink-0 gap-0.5">
          {shortcut.split(/\s+/u).map((key, index) => (
            // oxlint-disable-next-line react/no-array-index-key -- a shortcut may repeat a key (`G G`), so the cap's place is its identity
            <Kbd key={index} className="text-xs">
              <Kbd.Content>{key}</Kbd.Content>
            </Kbd>
          ))}
        </span>
      ) : null}
      {hasSub && !isLink && !isRail ? (
        <Icon
          name="chevron-down"
          className={cn(
            "size-4 shrink-0 text-muted transition-transform motion-reduce:transition-none",
            open ? "" : "-rotate-90 rtl:rotate-90",
          )}
        />
      ) : null}
    </>
  );

  const unfold = () => {
    if (isRail) sidebar?.setCollapsed(false);
    setOpen(isRail ? true : !open);
  };
  const row = isLink ? (
    <AriaLink
      {...omitUndefined({
        // A disabled link is a span, which React Aria still hands the `href` attribute, so it is left off here.
        href: isDisabled ? undefined : href,
        onPress,
        isDisabled,
        "aria-current": ariaCurrent,
      })}
      {...state}
      data-navigation-item={isDisabled ? undefined : ""}
      data-sidebar-focus=""
      className={rowClass ?? ""}
    >
      {content}
    </AriaLink>
  ) : (
    <AriaButton
      {...state}
      isDisabled={isDisabled}
      {...(hasSub ? { "aria-expanded": open && !isRail, "aria-controls": subId } : {})}
      data-sidebar-focus=""
      {...(hasSub ? { onPress: unfold } : {})}
      className={rowClass ?? ""}
    >
      {content}
    </AriaButton>
  );
  const hint = shortcut === undefined ? label : `${label} (${shortcut})`;

  return (
    <li
      {...rest}
      data-slot="sidebar-menu-item"
      className={cn("group/menu-item relative flex flex-col", className)}
    >
      <Tooltip content={hint} placement="end" isDisabled={!isRail}>
        {row}
      </Tooltip>
      {action === undefined || isRail ? null : (
        <span
          className={cn(
            "absolute end-1 top-0 flex items-center",
            isNested ? "h-8" : "h-9",
            // Shown on hover and focus where a pointer can hover; always on a touch screen.
            "opacity-0 transition-opacity group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 motion-reduce:transition-none [@media(hover:none)]:opacity-100",
          )}
        >
          {action}
        </span>
      )}
      {hasSub && isLink && !isRail ? (
        <button
          type="button"
          aria-expanded={open}
          aria-controls={subId}
          aria-label={t(UI_KEYS.ui.sidebar.sub_toggle, { label })}
          onClick={() => setOpen(!open)}
          className={cn(
            "absolute end-1 top-1.5 grid size-6 place-items-center rounded-[var(--radius-control)] text-muted outline-none",
            "hover:bg-default hover:text-foreground focus-visible:outline-2 focus-visible:outline-focus",
            action === undefined ? "" : "end-8",
          )}
        >
          <Icon
            name="chevron-down"
            className={cn(
              "size-4 transition-transform motion-reduce:transition-none",
              open ? "" : "-rotate-90 rtl:rotate-90",
            )}
          />
        </button>
      ) : null}
      {hasSub ? (
        <SidebarMenuDepthContext value={depth + 1}>
          <ul
            ref={subRef}
            id={subId}
            hidden={!open || isRail}
            data-slot="sidebar-menu-sub"
            // The indent guide: a rule down the start side, under the parent's icon.
            className="ms-5 mt-0.5 flex flex-col gap-0.5 border-s border-separator ps-2"
          >
            {children}
          </ul>
        </SidebarMenuDepthContext>
      ) : null}
    </li>
  );
}
