/**
 * Stackra file contract:
 * Purpose: the native `Menu` on HeroUI Native's Menu and SubMenu: draws the shared contract (the trigger as its child,
 *          `sections`, `placement`, `align`, `selectionMode`, `value`, `onChange`, `onAction` and the open state) as
 *          HeroUI Native's portal, overlay and content with each section a group, each action an item with its icon,
 *          title, second line and danger variant, a separator between sections, and one level of submenu. Every other
 *          HeroUI Native Menu prop passes through.
 * Boundary: no styling of its own beyond two utility classes that lay an item's text out. The menu opens as a popover
 *           by default; `presentation` picks a bottom sheet instead, and is given to both the root and the content,
 *           which HeroUI Native requires to agree. `placement` is turned into HeroUI's physical `left` or `right` by
 *           the text direction, and a bottom sheet ignores it. The shortcut hint is left out, because a touch menu has
 *           no keyboard. Native has no Escape key, so the menu closes on an outside press or a choice. An action with
 *           an `href` goes to the nearest `RouterProvider` for an app path, and to the system browser otherwise.
 *           Selection is scoped to a section, as on web.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0312; ADR 0165 (HeroUI Native on native); ADR 0060 (right-to-left);
 *          owner decision 6 of STA-350 (thin wrappers).
 */
import { Menu as HeroMenu, Separator, SubMenu, useIsRTL } from "heroui-native";
import { Fragment, use, useState, type ReactNode, type ReactElement } from "react";
import { Text, View } from "react-native";

import type { MenuLeafItem } from "#contracts/types/menu-leaf-item.type";
import { mergeSectionSelection } from "#core/functions/merge-section-selection.function";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { physicalSideOf } from "#core/functions/physical-side-of.function";
import { Icon } from "#native/icon/icon";
import { followHref } from "#native/router-provider/follow-href.function";
import { RouterContext } from "#native/router-provider/router-context";
import type { MenuProps } from "#native/menu/menu.props";

// Developer log text, read in the console only, so it stays English (ADR 0080 translates what users see).
const COULD_NOT_OPEN = "Menu could not open the link of an action";

/** The icon of an action: a name is drawn in the item's tone, an element as given. */
function MenuItemIcon({ item }: { readonly item: MenuLeafItem }): ReactNode {
  if (typeof item.icon === "string") {
    return <Icon name={item.icon} size="sm" tone={item.tone === "danger" ? "danger" : "default"} />;
  }
  return item.icon ?? null;
}

/** One action as an item: its icon, title and second line, and the selection mark inside a selecting group. */
function MenuAction({
  item,
  isSelectable,
  onChoose,
}: {
  readonly item: MenuLeafItem;
  readonly isSelectable: boolean;
  readonly onChoose: (item: MenuLeafItem) => void;
}) {
  // A disabled action says why, in the place a description would go.
  const detail = item.isDisabled && item.disabledReason ? item.disabledReason : item.description;
  return (
    <HeroMenu.Item
      id={item.id}
      variant={item.tone === "danger" ? "danger" : "default"}
      isDisabled={item.isDisabled ?? false}
      onPress={() => onChoose(item)}
    >
      <MenuItemIcon item={item} />
      {/* Grow from the text's own width: HeroUI's title is flex-1, which starts at zero and leaves a content-fit popover none. */}
      <View className="shrink grow">
        <HeroMenu.ItemTitle className="flex-auto">{item.label}</HeroMenu.ItemTitle>
        {detail ? <HeroMenu.ItemDescription>{detail}</HeroMenu.ItemDescription> : null}
      </View>
      {isSelectable ? <HeroMenu.ItemIndicator /> : null}
    </HeroMenu.Item>
  );
}

/**
 * A menu of actions that opens from its trigger. Choosing an action runs its `onPress`, follows its `href` and then
 * calls `onAction` with its key; with a `selectionMode` the chosen keys are the `value`, reported to `onChange`,
 * scoped to each section.
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
  // Taken out of `rest` because the root and its content must be given the same one.
  presentation = "popover",
  ...rest
}: MenuProps): ReactElement {
  const navigate = use(RouterContext);
  const isRtl = useIsRTL();
  // The menu always runs controlled: HeroUI Native hands back a `Set` per group, and one list of strings is the contract.
  const [own, setOwn] = useState<readonly string[]>(defaultValue ?? []);
  const selected = value ?? own;
  const isSelectable = selectionMode !== "none";
  const choose = (item: MenuLeafItem) => {
    item.onPress?.();
    if (item.href) followHref(item.href, navigate, COULD_NOT_OPEN);
    onAction?.(item.id);
  };
  const body = sections.map((section, index) => {
    const keys = section.items.map((item) => item.id);
    return (
      <Fragment key={section.id}>
        {index > 0 ? <Separator /> : null}
        <HeroMenu.Group
          selectionMode={selectionMode}
          accessibilityLabel={section.title}
          selectedKeys={selected.filter((key) => keys.includes(key))}
          onSelectionChange={(chosen) => {
            const next = mergeSectionSelection(selected, keys, [...chosen].map(String));
            setOwn(next);
            onChange?.(next);
          }}
        >
          {section.isTitleHidden ? null : <HeroMenu.Label>{section.title}</HeroMenu.Label>}
          {section.items.map((item) =>
            item.items ? (
              <SubMenu key={item.id}>
                <SubMenu.Trigger textValue={item.label} isDisabled={item.isDisabled ?? false}>
                  <SubMenu.TriggerIndicator />
                  <MenuItemIcon item={item} />
                  <Text className="shrink grow text-base font-medium text-foreground">
                    {item.label}
                  </Text>
                </SubMenu.Trigger>
                <SubMenu.Content>
                  {item.items.map((sub) => (
                    <MenuAction key={sub.id} item={sub} isSelectable={false} onChoose={choose} />
                  ))}
                </SubMenu.Content>
              </SubMenu>
            ) : (
              <MenuAction key={item.id} item={item} isSelectable={isSelectable} onChoose={choose} />
            ),
          )}
        </HeroMenu.Group>
      </Fragment>
    );
  });

  return (
    <HeroMenu
      {...rest}
      presentation={presentation}
      {...omitUndefined({ isOpen, isDefaultOpen: defaultOpen, onOpenChange })}
    >
      <HeroMenu.Trigger asChild>{children}</HeroMenu.Trigger>
      <HeroMenu.Portal>
        <HeroMenu.Overlay />
        {presentation === "popover" ? (
          <HeroMenu.Content
            presentation="popover"
            {...omitUndefined({
              placement: placement && physicalSideOf(placement, isRtl ? "rtl" : "ltr"),
              align,
            })}
          >
            {body}
          </HeroMenu.Content>
        ) : (
          <HeroMenu.Content presentation="bottom-sheet">{body}</HeroMenu.Content>
        )}
      </HeroMenu.Portal>
    </HeroMenu>
  );
}
