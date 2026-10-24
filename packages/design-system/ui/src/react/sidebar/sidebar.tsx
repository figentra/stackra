/**
 * Stackra file contract:
 * Purpose: the web `Sidebar`: the console's side column. It stacks `startContent` (a logo or workspace switcher), the
 *          `NavigationList` of the contract's `items` (the one `nav` landmark, scrolling when long), `endContent` (the
 *          user menu) and a toggle that collapses it to an icon rail and back. Expanded it is 16 rem wide, collapsed 4
 *          rem; the collapsed state is controlled with `isCollapsed` and `onCollapsedChange` or left to
 *          `defaultCollapsed`.
 * Boundary: HeroUI has no sidebar, so this is the adapted form on HeroUI's `Button` (through `IconButton`) and the
 *           NavigationList of this wave, which is the same group and so not a sibling in the sense of ADR 0317 decision
 *           4. It draws no off-canvas drawer: that is AppShell's, which hands a function `sidebar` slot
 *           `isInDrawer: true` so the sidebar can be drawn in full there with `isCollapsible` false. The slots are the
 *           app's nodes and are not told the collapsed state, so an app that shows a wordmark passes its own
 *           `isCollapsed` and draws a mark instead. Binding Cmd/Ctrl+B belongs to `@stackra/shortcuts`; the toggle is
 *           the pointer and keyboard path here. The toggle's icon mirrors in right-to-left, where the sidebar sits on
 *           the other side. Extra props pass to the root `div`; `label` names the `nav`.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0317 (decisions 1, 4 and 5); ADR 0060 (right-to-left);
 *          WCAG 2.2 SC 1.3.1, 2.5.8 and 4.1.2.
 */
import { cn } from "@heroui/react";
import { useState, type ComponentPropsWithRef, type ReactElement } from "react";

import type { SidebarContractProps } from "#contracts/types/sidebar-contract-props.type";
import { Icon } from "#react/icon/icon";
import { IconButton } from "#react/icon-button/icon-button";
import { NavigationList } from "#react/navigation-list/navigation-list";

// shortcut: English until @stackra/i18n ships; then the keys `ui::sidebar.collapse` and `ui::sidebar.expand`.
const STRINGS = { collapse: "Collapse sidebar", expand: "Expand sidebar" } as const;

/**
 * Props of the web Sidebar: the shared contract plus the root `div`'s own props, passed through. The sidebar's content
 * is `items` and its two slots, so the type refuses JSX children.
 */
export type SidebarProps = SidebarContractProps &
  Omit<ComponentPropsWithRef<"div">, keyof SidebarContractProps | "children"> & {
    /** False to leave out the collapse toggle, for a sidebar drawn inside AppShell's drawer. Defaults to true. */
    readonly isCollapsible?: boolean | undefined;
  };

/**
 * A side column of navigation. Controlled with `isCollapsed`, uncontrolled with `defaultCollapsed`; both report through
 * `onCollapsedChange`.
 */
export function Sidebar({
  items,
  label,
  startContent,
  endContent,
  isCollapsed,
  defaultCollapsed = false,
  onCollapsedChange,
  isCollapsible = true,
  className,
  ...rest
}: SidebarProps): ReactElement {
  const [ownCollapsed, setOwnCollapsed] = useState(defaultCollapsed);
  const collapsed = isCollapsed ?? ownCollapsed;
  const toggle = () => {
    setOwnCollapsed(!collapsed);
    onCollapsedChange?.(!collapsed);
  };

  return (
    <div
      {...rest}
      data-collapsed={collapsed ? "true" : undefined}
      className={cn(
        "flex h-full min-h-0 flex-col gap-2 border-e border-separator bg-surface p-2",
        collapsed ? "w-16" : "w-64",
        className,
      )}
    >
      {startContent}
      {/* `px-1` keeps the focus ring of an entry from being cut by the scrolling box. */}
      <NavigationList
        items={items}
        isCompact={collapsed}
        {...(label === undefined ? {} : { label })}
        className="min-h-0 flex-1 overflow-y-auto px-1"
      />
      {endContent}
      {isCollapsible ? (
        <IconButton
          variant="ghost"
          label={collapsed ? STRINGS.expand : STRINGS.collapse}
          icon={<Icon name={collapsed ? "panel-left-open" : "panel-left-close"} isMirroredInRtl />}
          onPress={toggle}
        />
      ) : null}
    </div>
  );
}
