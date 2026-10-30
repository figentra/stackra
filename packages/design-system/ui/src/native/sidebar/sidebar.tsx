/**
 * Stackra file contract:
 * Purpose: the native `Sidebar`, an adapted form. On a tablet (an iPad side panel) it is a column at the start edge,
 *          16 rem wide, with its collapse toggle: collapsed it narrows to a rail of icons (`collapsible="icon"`, each
 *          named for VoiceOver and TalkBack, the active one filled, a badge as a dot) or leaves the screen
 *          (`offcanvas`). On a phone there is no side column: given `isMobileOpen` it is a Drawer the app opens from its
 *          own button; otherwise it stacks `startContent`, the navigation and `endContent` in a column, for the sheet
 *          AppShell opens or a settings screen. `isSearchable` adds a filter box, `isLoading` placeholder rows, and the
 *          `floating` and `inset` looks draw the column as a rounded card.
 * Boundary: the expanded list is the native NavigationList of this wave (the same group, so not a sibling in the sense
 *           of ADR 0317 decision 4); the rail is Pressables on the same router seam (`RouterContext`). No keyboard
 *           shortcut, hover or resize on native. A string or number slot is drawn inside `Text`, because React Native
 *           refuses a bare string outside one. Extra props pass to the root `View`; `label` names the navigation.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3, adapted forms); ADR 0303 (decision 7); ADR 0317 (decisions 1, 4 and 7);
 *          WCAG 2.2 SC 1.3.1, 2.5.8 and 4.1.2; owner request 2026-10-29 (STA-1371, robust sidebar).
 */
import { use, useState, type ReactElement, type ReactNode } from "react";
import { Pressable, View } from "react-native";

import type { NavigationItem } from "#contracts/types/navigation-item.type";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { currentStateOf } from "#core/functions/current-state-of.function";
import { filterNavigationItems } from "#core/functions/filter-navigation-items.function";
import { initialsOf } from "#core/functions/initials-of.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { Drawer } from "#native/drawer/drawer";
import { IconButton } from "#native/icon-button/icon-button";
import { NavigationList } from "#native/navigation-list/navigation-list";
import { followHref } from "#native/router-provider/follow-href.function";
import { RouterContext } from "#native/router-provider/router-context";
import { SearchField } from "#native/search-field/search-field";
import { Skeleton } from "#native/skeleton/skeleton";
import { SlotIcon } from "#native/slot-icon/slot-icon";
import { Text } from "#native/text/text";
import type { SidebarProps } from "#native/sidebar/sidebar.props";
import { useBreakpoint } from "#native/use-breakpoint/use-breakpoint";

// Developer log text, read in the console only, so it stays English (ADR 0080 translates what users see).
const COULD_NOT_OPEN = "Sidebar entry could not open its URL";

/** The card each look draws the column in. */
const CARD = {
  sidebar: "border-e border-separator bg-surface",
  floating: "m-2 rounded-[var(--radius-container)] border border-separator bg-surface",
  inset: "bg-background",
} as const;

/** A slot as the column can draw it: a string or number goes inside `Text`, any other node as it is. */
function slotNode(node: ReactNode): ReactNode {
  return typeof node === "string" || typeof node === "number" ? <Text>{node}</Text> : node;
}

/** The entries the rail shows: every place one level under a group heading, and every top-level place. */
function railEntries(items: readonly NavigationItem[]): readonly NavigationItem[] {
  return items.flatMap((item) =>
    item.href === undefined && item.onPress === undefined ? (item.children ?? []) : [item],
  );
}

/** The `items` default, one array for every render. */
const NO_ITEMS: NonNullable<SidebarProps["items"]> = [];

/** A side column of navigation: a panel on a tablet, a drawer or a column on a phone. */
export function Sidebar({
  items = NO_ITEMS,
  label,
  startContent,
  endContent,
  variant = "sidebar",
  collapsible = "icon",
  isCollapsed,
  defaultCollapsed = false,
  onCollapsedChange,
  isMobileOpen,
  onMobileOpenChange,
  isSearchable = false,
  isLoading = false,
  className,
  ...rest
}: SidebarProps): ReactElement | null {
  const t = useUiText();
  const navigate = use(RouterContext);
  const isPhone = useBreakpoint().sizeClass === "phone";
  const [ownCollapsed, setOwnCollapsed] = useState(defaultCollapsed);
  const [query, setQuery] = useState("");
  const collapsed = !isPhone && collapsible !== "none" && (isCollapsed ?? ownCollapsed);
  const setCollapsed = (next: boolean) => {
    setOwnCollapsed(next);
    onCollapsedChange?.(next);
  };
  const shown = filterNavigationItems(items, query);
  const isRail = collapsed && collapsible === "icon";
  const follow = (item: NavigationItem) => {
    item.onPress?.();
    if (item.href !== undefined) followHref(item.href, navigate, COULD_NOT_OPEN);
  };

  const list = isLoading ? (
    <View accessibilityLabel={t(UI_KEYS.ui.sidebar.loading)} className="gap-2 px-2">
      {[0, 1, 2, 3, 4].map((row) => (
        <Skeleton
          key={row}
          className={
            isRail
              ? "size-8 rounded-[var(--radius-control)]"
              : "h-9 rounded-[var(--radius-control)]"
          }
        />
      ))}
    </View>
  ) : isRail ? (
    <View role="navigation" accessibilityLabel={label} className="items-center gap-1">
      {railEntries(shown).map((item) => {
        const isCurrent = currentStateOf(item) !== "none";
        const hasBadge = item.badge !== undefined && item.badge !== 0 && item.badge !== "";
        return (
          <Pressable
            key={item.id}
            accessibilityRole="link"
            accessibilityLabel={hasBadge ? `${item.label} (${item.badge})` : item.label}
            accessibilityState={{ selected: isCurrent, disabled: item.isDisabled === true }}
            disabled={item.isDisabled === true}
            onPress={() => follow(item)}
            className={`size-11 items-center justify-center rounded-[var(--radius-control)] ${isCurrent ? "bg-accent-soft" : ""}`}
          >
            {item.icon === undefined ? (
              <Text className="text-xs font-semibold">{initialsOf(item.label)}</Text>
            ) : (
              <SlotIcon icon={item.icon} />
            )}
            {hasBadge ? (
              <View className="absolute end-2 top-2 size-2 rounded-full bg-accent" />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  ) : (
    <NavigationList items={shown} {...(label === undefined ? {} : { label })} />
  );

  const hasToggle = !isPhone && collapsible !== "none";
  const column = (
    <View
      {...rest}
      className={[
        "gap-2 p-2",
        isPhone ? "" : `h-full ${isRail ? "w-20" : "w-64"} ${CARD[variant]}`,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {slotNode(startContent)}
      {hasToggle ? (
        <IconButton
          variant="ghost"
          icon={collapsed ? "panel-left-open" : "panel-left-close"}
          label={collapsed ? t(UI_KEYS.ui.sidebar.expand) : t(UI_KEYS.ui.sidebar.collapse)}
          onPress={() => setCollapsed(!collapsed)}
        />
      ) : null}
      {isSearchable && !isRail ? (
        <SearchField
          label={t(UI_KEYS.ui.sidebar.search)}
          placeholder={t(UI_KEYS.ui.sidebar.search)}
          value={query}
          onChange={setQuery}
        />
      ) : null}
      {!isLoading && shown.length === 0 && query !== "" ? (
        <Text tone="muted" className="px-3">
          {t(UI_KEYS.ui.sidebar.no_results)}
        </Text>
      ) : (
        list
      )}
      {slotNode(endContent)}
    </View>
  );

  if (isPhone && isMobileOpen !== undefined)
    return (
      <Drawer
        isOpen={isMobileOpen}
        {...(onMobileOpenChange === undefined ? {} : { onOpenChange: onMobileOpenChange })}
        placement="start"
        label={label ?? t(UI_KEYS.ui.app_shell.navigation)}
      >
        <Drawer.Body>{column}</Drawer.Body>
      </Drawer>
    );
  // Slid away: the app's own button brings it back.
  if (collapsed && collapsible === "offcanvas") return null;
  return column;
}
