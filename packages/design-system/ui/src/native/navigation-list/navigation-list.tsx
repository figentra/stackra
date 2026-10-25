/**
 * Stackra file contract:
 * Purpose: the native `NavigationList`: the same places as the web component, as pressable rows. Every item with an
 *          `href` or an `onPress` is a `ListItem` of wave 5 (icon, label, badge) in HeroUI Native's `ListGroup` surface;
 *          an item with only `children` is a small muted group heading over its rows; nested items follow their parent,
 *          indented. A press runs `onPress`, then opens `href` through the nearest `RouterProvider`, or the system for
 *          an absolute URL. The current place is selected (the native form of `aria-current`) and its row is filled.
 * Boundary: HeroUI Native has no navigation list, so this is the adapted form on its free ListGroup through ListItem
 *           (ADR 0302 decision 3). No React Navigation import: an app path reaches the stack through `RouterProvider`.
 *           A phone's main navigation is the tab bar, so this list is for a settings menu or an iPad sidebar. `shortcut`
 *           is unread: a phone has no hover and no keyboard to hint. The landmark is the container's navigation role and
 *           name; rows carry the link role. Every string child is drawn inside `Text`.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decisions 1, 5 and 7); ADR 0317 (decisions 1, 3, 5 and 7); ADR
 *          0165 (HeroUI Native on native); WCAG 2.2 SC 1.3.1, 2.5.8 and 4.1.2.
 */
import { ListGroup } from "heroui-native";
import { use, type ReactElement } from "react";
import { View, type ViewProps } from "react-native";

import type { NavigationItem } from "#contracts/types/navigation-item.type";
import type { NavigationListContractProps } from "#contracts/types/navigation-list-contract-props.type";
import { currentStateOf } from "#core/functions/current-state-of.function";
import { ListItem } from "#native/list/list-item";
import { followHref } from "#native/router-provider/follow-href.function";
import { RouterContext } from "#native/router-provider/router-context";
import { Text } from "#native/text/text";

// shortcut: English until @stackra/i18n ships; then the key `ui::navigation-list.label`.
const STRINGS = {
  label: "Navigation",
  couldNotOpen: "Navigation item could not open its URL",
} as const;

/**
 * Props of the native NavigationList: the shared contract plus the `View`'s own props, passed through. The view's
 * `accessibilityLabel` is the contract's `label`, so the type refuses it.
 */
export type NavigationListProps = NavigationListContractProps &
  Omit<ViewProps, keyof NavigationListContractProps | "accessibilityLabel" | "children">;

/** True when the entry is somewhere to go or something to run, and not only the heading of its children. */
function isLink(item: NavigationItem): boolean {
  return item.href !== undefined || item.onPress !== undefined;
}

/** A zero or empty badge draws nothing. */
function badgeOf(item: NavigationItem): string | number | undefined {
  return item.badge === 0 || item.badge === "" ? undefined : item.badge;
}

/** Props of {@link Level}. */
interface LevelProps {
  /** The entries of this level. */
  readonly items: readonly NavigationItem[];
  /** The nesting depth, 0 for the top level; a nested level is indented. */
  readonly depth: number;
  /** Follows an entry: runs its handler, then opens its `href`. */
  readonly follow: (item: NavigationItem) => void;
}

/** One level of entries: its links in one surface, its headings above their own nested levels. */
function Level({ items, depth, follow }: LevelProps): ReactElement {
  return (
    <View className={depth > 0 ? "ms-4" : ""}>
      {items.map((item) => {
        const children = item.children ?? [];
        const state = currentStateOf(item);
        return (
          <View key={item.id} className="gap-1 pt-1">
            {isLink(item) ? (
              <ListGroup>
                <ListItem
                  title={item.label}
                  startIcon={item.icon}
                  endContent={badgeOf(item)}
                  onPress={() => follow(item)}
                  isDisabled={item.isDisabled}
                  accessibilityRole="link"
                  accessibilityState={{ selected: state !== "none" }}
                  className={state === "none" ? "" : "bg-default"}
                />
              </ListGroup>
            ) : (
              <Text type="small" tone="muted" className="px-4 pt-3">
                {item.label}
              </Text>
            )}
            {children.length === 0 ? null : (
              <Level items={children} depth={depth + 1} follow={follow} />
            )}
          </View>
        );
      })}
    </View>
  );
}

/**
 * The places of an app as pressable rows. Name it with `label` when the screen holds more than one. The current place is
 * announced as selected.
 */
export function NavigationList({
  items,
  label = STRINGS.label,
  ...rest
}: NavigationListProps): ReactElement {
  const navigate = use(RouterContext);
  const follow = (item: NavigationItem) => {
    item.onPress?.();
    if (item.href !== undefined) followHref(item.href, navigate, STRINGS.couldNotOpen);
  };
  return (
    <View {...rest} role="navigation" accessibilityLabel={label}>
      <Level items={items} depth={0} follow={follow} />
    </View>
  );
}
