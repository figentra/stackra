/**
 * Stackra file contract:
 * Purpose: the web `Menu` on HeroUI v3's Dropdown: draws the shared contract (the trigger as its child, `sections`,
 *          `placement`, `align`, `selectionMode`, `value`, `onChange`, `onAction` and the open state) as HeroUI's
 *          popover and menu, with each action as an item carrying its icon, label, second line, shortcut hint, danger
 *          tone and disabled reason, a divider between sections, and one level of submenu. Every other Dropdown prop
 *          passes through.
 * Boundary: no styling of its own; the look is HeroUI's, themed by `@stackra/tokens`. The menu is named by its trigger
 *           (React Aria points it there), so the trigger needs an accessible name. Selection is scoped to a section and
 *           the menu keeps one flat list of chosen keys. An action with an `href` is a link, and navigates through the
 *           app's React Aria `RouterProvider` when it has one. The shortcut is a visual hint only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0312; ADR 0165 (UI contract, HeroUI v3 on web); owner decision 6 of
 *          STA-350 (thin wrappers); WCAG 2.2 SC 2.1.1, 4.1.2.
 */
import { Dropdown } from "@heroui/react";
import { useState, type ReactElement } from "react";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import { reactAriaPlacementOf } from "#core/functions/react-aria-placement-of.function";
import { MenuBody } from "#react/menu/menu-body";
import type { MenuProps } from "#react/menu/menu.props";

/**
 * A menu of actions that opens from its trigger. Choosing an action runs its `onPress` and then `onAction` with its key;
 * with a `selectionMode` the chosen keys are the `value`, reported to `onChange`, scoped to each section.
 */
export function Menu({
  children,
  sections,
  placement,
  align,
  selectionMode = "none",
  value,
  defaultValue,
  onChange,
  onAction,
  isOpen,
  defaultOpen,
  onOpenChange,
  ...rest
}: MenuProps): ReactElement {
  // The menu always runs controlled: React Aria hands back `Set`s per section, and one list of strings is the contract.
  const [own, setOwn] = useState<readonly string[]>(defaultValue ?? []);
  const selected = value ?? own;
  const hasPlacement = placement !== undefined || align !== undefined;

  return (
    <Dropdown {...rest} {...omitUndefined({ isOpen, defaultOpen, onOpenChange })}>
      {children}
      <Dropdown.Popover
        {...(hasPlacement ? { placement: reactAriaPlacementOf(placement ?? "bottom", align) } : {})}
      >
        <MenuBody
          sections={sections}
          selectionMode={selectionMode}
          selected={selected}
          onSelectedChange={(next) => {
            setOwn(next);
            onChange?.(next);
          }}
          onAction={(id) => onAction?.(id)}
        />
      </Dropdown.Popover>
    </Dropdown>
  );
}
