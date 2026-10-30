/**
 * Stackra file contract:
 * Purpose: `MenuBody`, the menu inside a Dropdown popover, shared by `Menu` and `Menubar`: the sections with a divider
 *          between them and a heading each (or a hidden title naming the group), every action as an item, selection
 *          scoped to a section and merged into one flat list of chosen keys, and one level of submenu.
 * Boundary: HeroUI's Dropdown menu, section, item and submenu; the popover and trigger around it are the caller's.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); WCAG 2.2 SC 2.1.1, 4.1.2.
 */
import { Dropdown, Header, Separator } from "@heroui/react";
import { Fragment, type ReactElement } from "react";

import type { MenuItem } from "#contracts/types/menu-item.type";
import { mergeSectionSelection } from "#core/functions/merge-section-selection.function";
import { MenuAction } from "#react/menu/menu-action";
import type { MenuBodyProps } from "#react/menu/menu-body.props";
import { MenuItemContent } from "#react/menu/menu-item-content";

/** The sections of a menu as HeroUI's Dropdown menu. */
export function MenuBody({
  sections,
  selectionMode,
  selected,
  onSelectedChange,
  onAction,
  ...rest
}: MenuBodyProps): ReactElement {
  const isSelectable = selectionMode !== "none";
  // React Aria reports a key; the contract reports a string.
  const handleAction = (key: unknown) => onAction(String(key));
  return (
    <Dropdown.Menu {...rest} onAction={handleAction}>
      {sections.map((section, index) => {
        const keys = section.items.map((item) => item.id);
        return (
          <Fragment key={section.id}>
            {index > 0 ? <Separator /> : null}
            <Dropdown.Section
              selectionMode={selectionMode}
              selectedKeys={new Set(selected.filter((key) => keys.includes(key)))}
              onSelectionChange={(chosen) =>
                onSelectedChange(
                  mergeSectionSelection(
                    selected,
                    keys,
                    chosen === "all" ? keys : [...chosen].map(String),
                  ),
                )
              }
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
  );
}
