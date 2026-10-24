/**
 * Stackra file contract:
 * Purpose: the page of the sidebar route: the expanded sidebar with a brand above and an account below, the collapsed
 *          icon rail, the current place with badges and a group, a sidebar without its toggle, an Arabic sidebar in a
 *          right-to-left block, and a live sidebar whose toggle and an outside button both drive the collapsed state
 *          and report it, all from `@stackra/ui/react` with real props.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n, text in another language carries
 *           its own `lang`. Each sidebar sits in a box with a height, because a sidebar fills its container; every one
 *           has its own `label`, so each navigation landmark is named once (axe `landmark-unique`). The brand and the
 *           account are the app's own nodes: they are not told the collapsed state, so each is drawn from the page's
 *           own `isCollapsed`. The hrefs are same-page anchors. The page adds the icons it draws beyond the playground
 *           registry through a registry of its own.
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0303 (decision 7); ADR 0314; ADR 0060 (right-to-left); WCAG
 *          2.2 SC 1.3.1, 2.5.8 and 4.1.2.
 */
import { defineIconRegistry } from "@stackra/icons";
import { IconRegistryProvider } from "@stackra/icons/react";
import {
  House,
  Inbox,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Users,
} from "@stackra/icons/react/lucide-icons";
import type { NavigationItem } from "@stackra/ui/contracts";
import * as Ui from "@stackra/ui/react";
import { useState, type ReactNode } from "react";
import { useLocation } from "react-router";

import { PageSection } from "#src/components/page-section";
import { SidebarRoute } from "#src/routes/sidebar/sidebar.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::sidebar.*` keys.
const STRINGS = {
  documentTitle: `${SidebarRoute.title} · Stackra Playground`,
  intro:
    "A sidebar is the side column of a console: a node above (a brand or workspace switcher), the navigation, a node below (the account) and a toggle that folds it to an icon rail. It holds one navigation landmark. Its collapsed state is controlled or uncontrolled like any other state.",
  expanded: "Expanded",
  expandedNote: "The full sidebar, 16 rem wide, with the app's own nodes above and below.",
  expandedLabel: "Expanded sidebar",
  collapsed: "Collapsed",
  collapsedNote:
    "The icon rail, 4 rem wide: each label stays the link's name and shows in a tooltip. An entry with no icon shows its first letter.",
  collapsedLabel: "Collapsed sidebar",
  current: "Current place and badges",
  currentNote: "The current entry is filled and marked; a badge sits after the label.",
  currentLabel: "Sidebar with the current place",
  noToggle: "Without the toggle",
  noToggleNote:
    "A sidebar drawn inside AppShell's drawer is never collapsed, so it leaves the toggle out.",
  noToggleLabel: "Sidebar without a toggle",
  arabic: "Arabic",
  arabicNote:
    "A right-to-left sidebar sits at the right with its border on the inner side, and the toggle's icon turns.",
  arabicLabel: "الشريط الجانبي",
  live: "Try it",
  liveNote:
    "The toggle inside the sidebar and the button outside both change the collapsed state, and the page reports it.",
  liveLabel: "Live sidebar",
  toggleOutside: "Toggle from outside",
  state: (isCollapsed: boolean) => `Sidebar: ${isCollapsed ? "collapsed" : "expanded"}`,
  brand: "Acme",
  brandMark: "A",
  account: "Ada Lovelace",
  accountMark: "L",
  home: "Home",
  orders: "Orders",
  customers: "Customers",
  inbox: "Inbox",
  settings: "Settings",
  profile: "Profile",
  billing: "Billing",
  arabicBrand: "أكمي",
  arabicHome: "الرئيسية",
  arabicOrders: "الطلبات",
  arabicCustomers: "العملاء",
} as const;

/** The icons this page draws beyond the playground registry, the sidebar's own toggle icons included. */
const PAGE_ICONS = defineIconRegistry({
  house: House,
  inbox: Inbox,
  package: Package,
  "panel-left-close": PanelLeftClose,
  "panel-left-open": PanelLeftOpen,
  users: Users,
});

/** The box a sidebar sits in: a sidebar fills its container, so it needs a height. */
const BOX = "h-96 w-fit overflow-hidden rounded-xl border border-border";

/** Props of {@link Boxed}. */
interface BoxedProps {
  /** The sidebar to put in the box. */
  readonly children: ReactNode;
}

/** A bordered box with a height for one sidebar. */
function Boxed({ children }: BoxedProps) {
  return <div className={BOX}>{children}</div>;
}

/** Props of {@link Brand} and {@link Account}. */
interface MarkProps {
  /** True when the sidebar is the rail: the node draws a short mark instead of its text. */
  readonly isCollapsed: boolean;
}

/** The app's brand node: its name, or one letter in the rail. */
function Brand({ isCollapsed }: MarkProps) {
  return (
    <Ui.Text className="px-2 pt-1 font-semibold">
      {isCollapsed ? STRINGS.brandMark : STRINGS.brand}
    </Ui.Text>
  );
}

/** The app's account node: the name, or one letter in the rail. */
function Account({ isCollapsed }: MarkProps) {
  return (
    <Ui.Text tone="muted" className="px-2">
      {isCollapsed ? STRINGS.accountMark : STRINGS.account}
    </Ui.Text>
  );
}

/** The Sidebar page. */
export function Sidebar() {
  const { pathname, search } = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  // A same-page anchor that keeps the scheme and language, which a bare `#id` would drop.
  const here = `${pathname}${search}`;
  const anchor = (id: string) => `${here}#${id}`;
  const items = (id: string, currentId?: string): readonly NavigationItem[] => [
    {
      id: "home",
      label: STRINGS.home,
      href: anchor(id),
      icon: "house",
      isCurrent: currentId === "home",
    },
    {
      id: "orders",
      label: STRINGS.orders,
      href: anchor(id),
      icon: "package",
      badge: 3,
      isCurrent: currentId === "orders",
    },
    { id: "customers", label: STRINGS.customers, href: anchor(id), icon: "users" },
    { id: "inbox", label: STRINGS.inbox, href: anchor(id), icon: "inbox", badge: 12 },
    {
      id: "settings",
      label: STRINGS.settings,
      children: [
        { id: "profile", label: STRINGS.profile, href: anchor(id) },
        { id: "billing", label: STRINGS.billing, href: anchor(id) },
      ],
    },
  ];

  return (
    <IconRegistryProvider registry={PAGE_ICONS}>
      <article className="grid gap-10">
        <title>{STRINGS.documentTitle}</title>
        <header className="grid gap-2">
          <Ui.Heading level={1}>{SidebarRoute.title}</Ui.Heading>
          <Ui.Text className="max-w-prose">
            <bdi>{STRINGS.intro}</bdi>
          </Ui.Text>
        </header>

        <PageSection id="sidebar-expanded" title={STRINGS.expanded} note={STRINGS.expandedNote}>
          <Boxed>
            <Ui.Sidebar
              label={STRINGS.expandedLabel}
              items={items("sidebar-expanded")}
              startContent={<Brand isCollapsed={false} />}
              endContent={<Account isCollapsed={false} />}
            />
          </Boxed>
        </PageSection>

        <PageSection id="sidebar-collapsed" title={STRINGS.collapsed} note={STRINGS.collapsedNote}>
          <Boxed>
            <Ui.Sidebar
              label={STRINGS.collapsedLabel}
              items={items("sidebar-collapsed")}
              isCollapsed
              startContent={<Brand isCollapsed />}
              endContent={<Account isCollapsed />}
            />
          </Boxed>
        </PageSection>

        <PageSection id="sidebar-current" title={STRINGS.current} note={STRINGS.currentNote}>
          <Boxed>
            <Ui.Sidebar
              label={STRINGS.currentLabel}
              items={items("sidebar-current", "orders")}
              startContent={<Brand isCollapsed={false} />}
            />
          </Boxed>
        </PageSection>

        <PageSection id="sidebar-no-toggle" title={STRINGS.noToggle} note={STRINGS.noToggleNote}>
          <Boxed>
            <Ui.Sidebar
              label={STRINGS.noToggleLabel}
              items={items("sidebar-no-toggle")}
              isCollapsible={false}
            />
          </Boxed>
        </PageSection>

        <PageSection id="sidebar-arabic" title={STRINGS.arabic} note={STRINGS.arabicNote}>
          <div lang="ar" dir="rtl">
            <Boxed>
              <Ui.Sidebar
                label={STRINGS.arabicLabel}
                startContent={
                  <Ui.Text className="px-2 pt-1 font-semibold">{STRINGS.arabicBrand}</Ui.Text>
                }
                items={[
                  {
                    id: "home",
                    label: STRINGS.arabicHome,
                    href: anchor("sidebar-arabic"),
                    icon: "house",
                  },
                  {
                    id: "orders",
                    label: STRINGS.arabicOrders,
                    href: anchor("sidebar-arabic"),
                    icon: "package",
                    isCurrent: true,
                  },
                  {
                    id: "customers",
                    label: STRINGS.arabicCustomers,
                    href: anchor("sidebar-arabic"),
                    icon: "users",
                  },
                ]}
              />
            </Boxed>
          </div>
        </PageSection>

        <PageSection id="sidebar-live" title={STRINGS.live} note={STRINGS.liveNote}>
          <div className="flex flex-wrap items-start gap-4">
            <Boxed>
              <Ui.Sidebar
                label={STRINGS.liveLabel}
                items={items("sidebar-live", "home")}
                isCollapsed={isCollapsed}
                onCollapsedChange={setIsCollapsed}
                startContent={<Brand isCollapsed={isCollapsed} />}
                endContent={<Account isCollapsed={isCollapsed} />}
              />
            </Boxed>
            <div className="grid gap-3">
              <Ui.Button variant="secondary" onPress={() => setIsCollapsed((value) => !value)}>
                {STRINGS.toggleOutside}
              </Ui.Button>
              <output aria-live="polite" data-testid="sidebar-state">
                <bdi>{STRINGS.state(isCollapsed)}</bdi>
              </output>
            </div>
          </div>
        </PageSection>
      </article>
    </IconRegistryProvider>
  );
}
