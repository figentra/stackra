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
import * as UiPro from "@stackra-pro/ui/react";

import { DemoIcon } from "#src/components/demo-icon";
import { DEMO_NAVIGATION } from "#src/components/demo-navigation/demo-navigation.constant";
import type { DemoNavigationProps } from "#src/components/demo-navigation/demo-navigation.props";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::navigation.*` keys.
const STRINGS = {
  brand: "Acme",
  workspace: "Workspace",
  navigation: "Workspace navigation",
  account: "Account navigation",
} as const;

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
            {DEMO_NAVIGATION.items.map((item) => (
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
            id={DEMO_NAVIGATION.settings.id}
            textValue={DEMO_NAVIGATION.settings.label}
            isCurrent={current === DEMO_NAVIGATION.settings.id}
            onAction={() => onNavigate(DEMO_NAVIGATION.settings.id)}
          >
            <UiPro.Sidebar.MenuIcon label={DEMO_NAVIGATION.settings.label}>
              <DemoIcon name={DEMO_NAVIGATION.settings.icon} />
            </UiPro.Sidebar.MenuIcon>
            <UiPro.Sidebar.MenuLabel>{DEMO_NAVIGATION.settings.label}</UiPro.Sidebar.MenuLabel>
          </UiPro.Sidebar.MenuItem>
        </UiPro.Sidebar.Menu>
      </UiPro.Sidebar.Footer>
    </>
  );
}
