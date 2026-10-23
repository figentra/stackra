/**
 * Stackra file contract:
 * Purpose: the sidebar content shared by the Sidebar and AppLayout demo pages: a brand header, a workspace menu with
 *          one expandable item and a count, and an account footer. Pressing an item reports its id, and the current
 *          one is marked, so the pages show a navigation that works without leaving the page.
 * Boundary: presentation and local state only; items carry no `href`, since the shell's router would rewrite the
 *          address and drop the scheme and locale the playground keeps in it.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0310 (decision 6); STA-403 FR-013, FR-005.
 */
import * as UiPro from "@stackra/ui-pro/react";

import { DemoIcon, type DemoIconName } from "#src/components/demo-icon";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::navigation.*` keys.
const STRINGS = {
  brand: "Acme",
  workspace: "Workspace",
  navigation: "Workspace navigation",
  account: "Account navigation",
} as const;

/** One navigation entry; an entry with `children` expands instead of navigating. */
interface NavigationItem {
  readonly id: string;
  readonly label: string;
  readonly icon: DemoIconName;
  readonly count?: string;
  readonly children?: readonly { readonly id: string; readonly label: string }[];
}

const ITEMS: readonly NavigationItem[] = [
  { id: "dashboard", label: "Dashboard", icon: "home" },
  { id: "orders", label: "Orders", icon: "doc", count: "12" },
  { id: "customers", label: "Customers", icon: "users" },
  {
    id: "reports",
    label: "Reports",
    icon: "chart",
    children: [
      { id: "reports-overview", label: "Overview" },
      { id: "reports-revenue", label: "Revenue" },
    ],
  },
];

const SETTINGS = { id: "settings", label: "Settings", icon: "gear" } as const;

/** The label of a navigation id, for the page that shows where the user is. */
export function navigationLabel(id: string): string {
  const all = [...ITEMS, SETTINGS].flatMap((item) => [
    item,
    ...("children" in item ? (item.children ?? []) : []),
  ]);
  return all.find((item) => item.id === id)?.label ?? id;
}

/** Props of {@link DemoNavigation}. */
export interface DemoNavigationProps {
  /** The id of the current item. */
  current: string;
  /** Called with the id of the item the user pressed. */
  onNavigate: (id: string) => void;
}

/** The header, content and footer of a demo sidebar, for `Sidebar` and `Sidebar.Mobile` alike. */
export function DemoNavigation({ current, onNavigate }: DemoNavigationProps) {
  return (
    <>
      <UiPro.Sidebar.Header>
        <div className="flex items-center gap-3 px-1 py-2">
          <div
            aria-hidden="true"
            className="flex size-6 shrink-0 items-center justify-center rounded-md bg-accent text-sm font-bold text-accent-foreground"
          >
            A
          </div>
          <span className="text-sm font-semibold text-foreground" data-sidebar="label">
            {STRINGS.brand}
          </span>
        </div>
      </UiPro.Sidebar.Header>
      <UiPro.Sidebar.Content>
        <UiPro.Sidebar.Group>
          <UiPro.Sidebar.GroupLabel>{STRINGS.workspace}</UiPro.Sidebar.GroupLabel>
          <UiPro.Sidebar.Menu label={STRINGS.navigation} defaultExpandedKeys={["reports"]}>
            {ITEMS.map((item) => (
              <UiPro.Sidebar.MenuItem
                key={item.id}
                id={item.id}
                textValue={item.label}
                isCurrent={current === item.id}
                {...(item.children ? {} : { onAction: () => onNavigate(item.id) })}
              >
                <UiPro.Sidebar.MenuIcon label={item.label}>
                  <DemoIcon name={item.icon} />
                </UiPro.Sidebar.MenuIcon>
                <UiPro.Sidebar.MenuLabel>
                  {item.label}
                  {item.children ? (
                    <UiPro.Sidebar.MenuTrigger>
                      <UiPro.Sidebar.MenuIndicator />
                    </UiPro.Sidebar.MenuTrigger>
                  ) : null}
                </UiPro.Sidebar.MenuLabel>
                {item.count ? <UiPro.Sidebar.MenuChip>{item.count}</UiPro.Sidebar.MenuChip> : null}
                {item.children ? (
                  <UiPro.Sidebar.Submenu>
                    {item.children.map((child) => (
                      <UiPro.Sidebar.MenuItem
                        key={child.id}
                        id={child.id}
                        textValue={child.label}
                        isCurrent={current === child.id}
                        onAction={() => onNavigate(child.id)}
                      >
                        <UiPro.Sidebar.MenuLabel>{child.label}</UiPro.Sidebar.MenuLabel>
                      </UiPro.Sidebar.MenuItem>
                    ))}
                  </UiPro.Sidebar.Submenu>
                ) : null}
              </UiPro.Sidebar.MenuItem>
            ))}
          </UiPro.Sidebar.Menu>
        </UiPro.Sidebar.Group>
      </UiPro.Sidebar.Content>
      <UiPro.Sidebar.Footer>
        <UiPro.Sidebar.Menu label={STRINGS.account}>
          <UiPro.Sidebar.MenuItem
            id={SETTINGS.id}
            textValue={SETTINGS.label}
            isCurrent={current === SETTINGS.id}
            onAction={() => onNavigate(SETTINGS.id)}
          >
            <UiPro.Sidebar.MenuIcon label={SETTINGS.label}>
              <DemoIcon name={SETTINGS.icon} />
            </UiPro.Sidebar.MenuIcon>
            <UiPro.Sidebar.MenuLabel>{SETTINGS.label}</UiPro.Sidebar.MenuLabel>
          </UiPro.Sidebar.MenuItem>
        </UiPro.Sidebar.Menu>
      </UiPro.Sidebar.Footer>
    </>
  );
}
