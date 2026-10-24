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
import { Dropdown, Header, Kbd, Separator, type DropdownRootProps } from "@heroui/react";
import { Fragment, useState } from "react";

import type { MenuContractProps } from "#contracts/types/menu-contract-props.type";
import type { MenuItem } from "#contracts/types/menu-item.type";
import type { MenuLeafItem } from "#contracts/types/menu-leaf-item.type";
import { mergeSectionSelection } from "#core/functions/merge-section-selection.function";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { reactAriaPlacementOf } from "#core/functions/react-aria-placement-of.function";
import { SlotIcon } from "#react/slot-icon/slot-icon";

/**
 * Props of the web Menu: the shared contract plus HeroUI v3's own Dropdown props (`trigger`, for one), passed through
 * unchanged. The app lists actions as `sections`; the only child is the trigger.
 */
export type MenuProps = MenuContractProps &
  Omit<DropdownRootProps, keyof MenuContractProps | "children">;

/** The content of one action: its icon, its label with a second line, its shortcut hint and the selection mark. */
function MenuItemContent({
  item,
  isSelectable,
}: {
  readonly item: MenuLeafItem;
  readonly isSelectable: boolean;
}) {
  // A disabled action says why, in the place a description would go, because it cannot take focus to show a tooltip.
  const detail = item.isDisabled && item.disabledReason ? item.disabledReason : item.description;
  return (
    <>
      {isSelectable ? <Dropdown.ItemIndicator /> : null}
      <SlotIcon icon={item.icon} />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Plain spans, not React Aria's `label` and `description` slots: those name the item by its label alone
            and describe it by the rest, and the rest is visible text that a name must hold (WCAG 2.5.3). */}
        <span data-slot="label">{item.label}</span>
        {detail ? (
          <span data-slot="description" className="description">
            {detail}
          </span>
        ) : null}
      </div>
      {item.shortcut ? (
        <Kbd>
          <Kbd.Content>{item.shortcut}</Kbd.Content>
        </Kbd>
      ) : null}
    </>
  );
}

/** One action as a menu item: a link when it has an `href`, its handler as the item's own action. */
function MenuAction({
  item,
  isSelectable,
}: {
  readonly item: MenuLeafItem;
  readonly isSelectable: boolean;
}) {
  return (
    <Dropdown.Item
      id={item.id}
      textValue={item.label}
      variant={item.tone === "danger" ? "danger" : "default"}
      isDisabled={item.isDisabled ?? false}
      {...omitUndefined({ href: item.href, onAction: item.onPress })}
    >
      <MenuItemContent item={item} isSelectable={isSelectable} />
    </Dropdown.Item>
  );
}

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
}: MenuProps) {
  // The menu always runs controlled: React Aria hands back `Set`s per section, and one list of strings is the contract.
  const [own, setOwn] = useState<readonly string[]>(defaultValue ?? []);
  const selected = value ?? own;
  const isSelectable = selectionMode !== "none";
  // React Aria reports a key; the contract reports a string.
  const handleAction = (key: unknown) => onAction?.(String(key));
  const hasPlacement = placement !== undefined || align !== undefined;

  return (
    <Dropdown {...rest} {...omitUndefined({ isOpen, defaultOpen, onOpenChange })}>
      {children}
      <Dropdown.Popover
        {...(hasPlacement ? { placement: reactAriaPlacementOf(placement ?? "bottom", align) } : {})}
      >
        <Dropdown.Menu onAction={handleAction}>
          {sections.map((section, index) => {
            const keys = section.items.map((item) => item.id);
            return (
              <Fragment key={section.id}>
                {index > 0 ? <Separator /> : null}
                <Dropdown.Section
                  selectionMode={selectionMode}
                  selectedKeys={new Set(selected.filter((key) => keys.includes(key)))}
                  onSelectionChange={(chosen) => {
                    const next = mergeSectionSelection(
                      selected,
                      keys,
                      chosen === "all" ? keys : [...chosen].map(String),
                    );
                    setOwn(next);
                    onChange?.(next);
                  }}
                  // A hidden title still names the group; a shown one is its heading, which React Aria wires itself.
                  {...(section.isTitleHidden ? { "aria-label": section.title } : {})}
                >
                  {section.isTitleHidden ? null : <Header>{section.title}</Header>}
                  {section.items.map((item: MenuItem) =>
                    item.items ? (
                      <Dropdown.SubmenuTrigger key={item.id}>
                        <Dropdown.Item
                          id={item.id}
                          textValue={item.label}
                          isDisabled={item.isDisabled ?? false}
                        >
                          <MenuItemContent item={item} isSelectable={false} />
                          <Dropdown.SubmenuIndicator />
                        </Dropdown.Item>
                        <Dropdown.Popover>
                          <Dropdown.Menu aria-label={item.label} onAction={handleAction}>
                            {item.items.map((sub) => (
                              <MenuAction key={sub.id} item={sub} isSelectable={false} />
                            ))}
                          </Dropdown.Menu>
                        </Dropdown.Popover>
                      </Dropdown.SubmenuTrigger>
                    ) : (
                      <MenuAction key={item.id} item={item} isSelectable={isSelectable} />
                    ),
                  )}
                </Dropdown.Section>
              </Fragment>
            );
          })}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
