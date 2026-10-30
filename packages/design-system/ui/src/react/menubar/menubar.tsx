/**
 * Stackra file contract:
 * Purpose: the web `Menubar`: an application's bar of menus (File, Edit, View) on the WAI-ARIA menubar pattern. The
 *          bar is one tab stop; Left and Right (mirrored in right-to-left) and Home and End move between its menus,
 *          Down, Up, Enter or Space open one; inside an open menu Left and Right close it and open the neighbour on its
 *          first action, and moving the pointer over another menu's name while one is open switches to it. Each menu
 *          is the house Menu's body (sections, dividers, headings, checkable actions, shortcut hints, submenus).
 * Boundary: each menu is HeroUI's Dropdown (React Aria's MenuTrigger and Menu): it owns the menu's keys, typeahead,
 *           dismissal and focus return. The bar catches Left and Right on their way up from the open menu (React
 *           events bubble through the portal), except where they open or close a submenu. The open menu's underlay
 *           covers the bar, so the pointer switch reads the pointer's position against the menus' names. The checked
 *           keys are one list across all menus.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); WAI-ARIA menubar pattern; WCAG 2.2 SC 2.1.1, 2.4.3 and 4.1.2; STA-1371
 *          (wave D, owner approval 2026-10-30).
 */
import { cn, Dropdown } from "@heroui/react";
import { useEffect, useRef, useState, type KeyboardEvent, type ReactElement } from "react";
import { useLocale } from "react-aria";

import { OVERLAY_SELECTION_KEYS } from "#core/constants/overlay-selection-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { MenuBody } from "#react/menu/menu-body";
import { MenubarTrigger } from "#react/menubar/menubar-trigger";
import type { MenubarProps } from "#react/menubar/menubar.props";

/** Nothing checked yet. */
const NONE: readonly string[] = [];

/** An application menubar. */
export function Menubar({
  menus,
  value,
  defaultValue,
  onChange,
  onAction,
  "aria-label": ariaLabel,
  className,
}: MenubarProps): ReactElement {
  const t = useUiText();
  const { direction } = useLocale();
  const [openId, setOpenId] = useState<string | null>(null);
  const [tabStop, setTabStop] = useState(menus[0]?.id ?? "");
  // True when the open menu was reached with Left or Right, so it opens on its first action.
  const [isKeyed, setKeyed] = useState(false);
  const [own, setOwn] = useState(defaultValue ?? NONE);
  const selected = value ?? own;
  const triggers = useRef(new Map<string, HTMLButtonElement>());
  const forward = direction === "rtl" ? "ArrowLeft" : "ArrowRight";
  const backward = direction === "rtl" ? "ArrowRight" : "ArrowLeft";

  /** The id of the menu `by` places from `id`, wrapping around. */
  const neighbour = (id: string, by: 1 | -1) => {
    const at = menus.findIndex((menu) => menu.id === id);
    return menus[(at + by + menus.length) % menus.length]?.id ?? id;
  };

  useEffect(() => {
    if (openId === null) return;
    const onMove = (event: PointerEvent) => {
      for (const [id, element] of triggers.current) {
        const box = element.getBoundingClientRect();
        const isOver =
          event.clientX >= box.left &&
          event.clientX <= box.right &&
          event.clientY >= box.top &&
          event.clientY <= box.bottom;
        if (isOver && id !== openId) {
          setKeyed(false);
          setTabStop(id);
          setOpenId(id);
        }
      }
    };
    document.addEventListener("pointermove", onMove);
    return () => document.removeEventListener("pointermove", onMove);
  }, [openId]);

  const onBarKey = (id: string) => (event: KeyboardEvent<HTMLButtonElement>) => {
    const first = menus[0]?.id;
    const last = menus.at(-1)?.id;
    const target =
      event.key === forward
        ? neighbour(id, 1)
        : event.key === backward
          ? neighbour(id, -1)
          : event.key === "Home"
            ? first
            : event.key === "End"
              ? last
              : undefined;
    if (target === undefined) return;
    event.preventDefault();
    setTabStop(target);
    triggers.current.get(target)?.focus();
  };

  const onMenuKey = (id: string) => (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== forward && event.key !== backward) return;
    const element = event.target as HTMLElement;
    // Only the top menu's own actions: a submenu's keys, and the key that opens a submenu, stay React Aria's.
    if (!element.closest("[data-menubar-menu]")) return;
    if (event.key === forward && element.getAttribute("aria-haspopup")) return;
    event.preventDefault();
    event.stopPropagation();
    const target = neighbour(id, event.key === forward ? 1 : -1);
    setKeyed(true);
    setTabStop(target);
    setOpenId(target);
  };

  return (
    <div
      role="menubar"
      aria-label={ariaLabel ?? t(OVERLAY_SELECTION_KEYS.ui.menubar.label)}
      aria-orientation="horizontal"
      className={cn("flex items-center gap-0.5", className)}
    >
      {menus.map((menu) => (
        <div key={menu.id} role="none" onKeyDownCapture={onMenuKey(menu.id)}>
          <Dropdown
            isOpen={openId === menu.id}
            onOpenChange={(isOpen) => {
              if (isOpen) {
                setTabStop(menu.id);
                setOpenId(menu.id);
              } else {
                setKeyed(false);
                setOpenId((current) => (current === menu.id ? null : current));
              }
            }}
          >
            <MenubarTrigger
              label={menu.label}
              isTabStop={tabStop === menu.id}
              isOpen={openId === menu.id}
              register={(element) => {
                if (element) triggers.current.set(menu.id, element);
                else triggers.current.delete(menu.id);
              }}
              onKeyDown={onBarKey(menu.id)}
            />
            <Dropdown.Popover placement="bottom start">
              <MenuBody
                data-menubar-menu=""
                sections={menu.sections}
                selectionMode={menu.selectionMode ?? "none"}
                selected={selected}
                onSelectedChange={(next) => {
                  if (value === undefined) setOwn(next);
                  onChange?.(next);
                }}
                onAction={(id) => onAction?.(id)}
                {...(isKeyed ? { autoFocus: "first" as const } : {})}
              />
            </Dropdown.Popover>
          </Dropdown>
        </div>
      ))}
    </div>
  );
}
