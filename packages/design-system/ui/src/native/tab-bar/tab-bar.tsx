/**
 * Stackra file contract:
 * Purpose: the native `TabBar`, a presentational bar the navigator renders (a React Navigation tab navigator's custom
 *          tab bar, bound by @stackra/navigation). A row of up to five tabs from the inline start, each a pressable
 *          column of the item's icon, its label and an optional count badge; the current tab is drawn in the accent
 *          tone and announced as selected, a disabled tab refuses the press, and the bar clears the home indicator with
 *          the bottom safe-area inset. A press runs the item's `onPress`, then opens its `href` through the nearest
 *          `RouterProvider`.
 * Boundary: the system tab bar of `react-native-bottom-tabs` is drawn by the platform and takes no children, so this is
 *           the documented adapted form on React Native's `Pressable`, the wave 1 Badge and Text, and theme tokens: the
 *           one bar an Android build and a design that needs a custom bar share. It has no web form (the web shell uses
 *           the Sidebar, ADR 0317 decision 7). No router import: a tab is a place in the app, so an `href` is an app
 *           path, and one with a scheme is not followed. Tabs are the first level of the items only, and a sixth item is
 *           left out with a development warning, because Android's bar holds five. The tab's accessible name holds the
 *           badge ("Orders, 3") since the badge itself is hidden from the reader. The bar is a `tablist` named by `label`;
 *           each tab is at least 56 points high, past the 24 px of WCAG 2.5.8. Every string child is drawn inside `Text`.
 *           Extra props pass to the root `View`.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3, adapted forms); ADR 0303 (decisions 1 and 7); ADR 0317 (decisions 1, 3 and
 *          7); ADR 0061 (React Navigation and native tabs); ADR 0060; WCAG 2.2 SC 1.3.1, 2.5.8 and 4.1.2.
 */
// Uniwind adds `className` to React Native's own components, which the root `View` and `Pressable` take.
/// <reference types="uniwind/types" />
import { use, type ReactElement } from "react";
import { Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import type { NavigationItem } from "#contracts/types/navigation-item.type";
import { currentStateOf } from "#core/functions/current-state-of.function";
import { isAbsoluteUrl } from "#core/functions/is-absolute-url.function";
import { Badge } from "#native/badge/badge";
import { Icon } from "#native/icon/icon";
import { RouterContext } from "#native/router-provider/router-context";
import { Text } from "#native/text/text";
import type { TabBarProps } from "#native/tab-bar/tab-bar.props";
import { GlassSurface } from "#native/glass/glass-surface";

// Developer log text, read in the console only, so it stays English (ADR 0080 translates what users see).
const TOO_MANY = "TabBar draws five tabs at most; the rest are left out";

/** The most tabs a phone's tab bar holds: Android's navigation bar limit. */
const MAX_TABS = 5;

/** A zero or empty badge draws nothing. */
function badgeOf(item: NavigationItem): string | number | undefined {
  return item.badge === 0 || item.badge === "" ? undefined : item.badge;
}

/** Props of {@link Tab}. */
interface TabProps {
  /** The item the tab shows. */
  readonly item: NavigationItem;
  /** Follows the item: runs its handler, then opens its `href`. */
  readonly follow: (item: NavigationItem) => void;
}

/** One tab: icon with its badge, and the label under it. */
function Tab({ item, follow }: TabProps): ReactElement {
  const isCurrent = currentStateOf(item) !== "none";
  const badge = badgeOf(item);
  const tone = isCurrent ? "accent" : "muted";
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={badge === undefined ? item.label : `${item.label}, ${badge}`}
      accessibilityState={{ selected: isCurrent, disabled: item.isDisabled === true }}
      disabled={item.isDisabled === true}
      onPress={() => follow(item)}
      className={[
        "min-h-14 flex-1 items-center justify-center gap-1 px-1 py-1.5",
        item.isDisabled ? "opacity-50" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Badge.Anchor className="self-center">
        {typeof item.icon === "string" ? (
          <Icon name={item.icon} tone={tone} />
        ) : (
          (item.icon ?? null)
        )}
        {badge === undefined ? null : (
          <Badge size="sm" tone="danger" placement="top-end">
            {badge}
          </Badge>
        )}
      </Badge.Anchor>
      <Text type="small" tone={tone} isTruncated className={isCurrent ? "font-semibold" : ""}>
        {item.label}
      </Text>
    </Pressable>
  );
}

/**
 * The phone's bottom tab bar: one tab for each of the first five items. Name it with `label` when the screen holds
 * more than one. The current tab is announced as selected.
 */
export function TabBar({
  items,
  label: labelProp,
  className,
  style,
  ...rest
}: TabBarProps): ReactElement {
  const t = useUiText();
  const label = labelProp ?? t(UI_KEYS.ui.tab_bar.label);
  const navigate = use(RouterContext);
  const insets = useSafeAreaInsets();
  if (items.length > MAX_TABS && process.env.NODE_ENV !== "production") {
    // oxlint-disable-next-line no-console -- reason: a developer warning; @stackra/ui has no logger dependency
    console.warn(TOO_MANY);
  }
  const follow = (item: NavigationItem) => {
    item.onPress?.();
    const href = item.href;
    if (href !== undefined && navigate && !isAbsoluteUrl(href)) navigate(href);
  };
  return (
    // The tab-bar role: glass in both families (ADR 0320 as amended 2026-10-31).
    <GlassSurface
      material="tab-bar"
      {...rest}
      accessibilityRole="tablist"
      accessibilityLabel={label}
      className={["flex-row border-t border-separator", className].filter(Boolean).join(" ")}
      style={[{ paddingBottom: insets.bottom }, style]}
    >
      {items.slice(0, MAX_TABS).map((item) => (
        <Tab key={item.id} item={item} follow={follow} />
      ))}
    </GlassSurface>
  );
}
