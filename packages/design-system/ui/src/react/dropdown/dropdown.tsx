/**
 * Stackra file contract:
 * Purpose: the web `Dropdown` compound on HeroUI v3's Dropdown (React Aria menu): `Dropdown` holds the open state,
 *          `Dropdown.Trigger` is the button, `Dropdown.Menu` is the menu in its popover, and `Dropdown.Item` draws its
 *          label, an optional `description` line and the selection mark, in the `danger` look when `color` is the
 *          danger tone. For a menu written inline, such as an account or a locale switcher.
 * Boundary: thin: every HeroUI and React Aria prop passes through (`selectionMode`, `selectedKeys`, `onAction`,
 *           `textValue`, `href`). The label and description are plain spans, not React Aria's slots, so the item's
 *           accessible name holds all its visible text (WCAG 2.5.3), as `Menu`'s items do. For a menu built from data
 *           with sections and shortcuts, use `Menu`.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (UI contract, HeroUI v3 on web); ADR 0303 (decision 7); owner
 *                     decision 6 of STA-350 (thin wrappers); explicit compound type so the declaration emit is
 *                     self-contained (STA-1220).
 */
/* oxlint-disable react/only-export-components -- the compound is Object.assign(Root, parts), so the export is the
   root function, which React Refresh takes as a component; the boundary holds (rule-gap B-6). */
import {
  Dropdown as HeroDropdown,
  type DropdownMenuProps as HeroDropdownMenuProps,
} from "@heroui/react";
import type { ReactElement } from "react";
import type { DropdownItemProps } from "#react/dropdown/dropdown-item.props";

/** The menu in its popover, so a dropdown is written as trigger plus menu. */
function DropdownMenu<T extends object>(props: HeroDropdownMenuProps<T>): ReactElement {
  return (
    <HeroDropdown.Popover>
      <HeroDropdown.Menu {...props} />
    </HeroDropdown.Popover>
  );
}

/** One item: the selection mark, the label and the optional description. */
function DropdownItem({ children, description, color, ...rest }: DropdownItemProps): ReactElement {
  return (
    <HeroDropdown.Item
      // React Aria types ahead by `textValue`; a plain-text label is its own.
      {...(typeof children === "string" ? { textValue: children } : {})}
      {...rest}
      variant={color === "danger" ? "danger" : "default"}
    >
      <HeroDropdown.ItemIndicator />
      <div className="flex min-w-0 flex-1 flex-col">
        <span data-slot="label">{children}</span>
        {description ? (
          <span data-slot="description" className="description">
            {description}
          </span>
        ) : null}
      </div>
    </HeroDropdown.Item>
  );
}

/** The dropdown root: HeroUI's, which holds the open state. */
function DropdownRoot(props: Parameters<typeof HeroDropdown>[0]): ReactElement {
  return <HeroDropdown {...props} />;
}

/** The parts of the compound, typed from HeroUI's own so the declaration output can name them (TS2883). */
interface DropdownParts {
  /** The button that opens the menu; give it an `aria-label` when it shows no text. */
  readonly Trigger: typeof HeroDropdown.Trigger;
  /** The menu, drawn in its popover. */
  readonly Menu: typeof DropdownMenu;
  /** One action or choice. */
  readonly Item: typeof DropdownItem;
}

/** A menu behind a button: `Dropdown`, `Dropdown.Trigger`, `Dropdown.Menu` and `Dropdown.Item`. */
export const Dropdown: typeof DropdownRoot & DropdownParts = Object.assign(DropdownRoot, {
  Trigger: HeroDropdown.Trigger,
  Menu: DropdownMenu,
  Item: DropdownItem,
});
