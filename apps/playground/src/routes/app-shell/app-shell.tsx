/**
 * Stackra file contract:
 * Purpose: the page of the app-shell route: the console frame (a sidebar column, a header and the page) at the default
 *          `md` breakpoint and at `xl`, the drawer a narrow window opens in place of the column (with the function
 *          form of `sidebar`, a Close button and a close on choosing an entry), a shell with no sidebar, an Arabic
 *          shell in a right-to-left block, and a live shell whose button opens the drawer at any width and reports
 *          the open state, all from `@stackra/ui/react` with real props.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n, text in another language carries
 *           its own `lang`. Each shell is `isEmbedded` and sits in a box with a height: the playground already has the
 *           page's one `main` and skip link, and a page holds one of each. A shell hides its column by the viewport's
 *           width (a Tailwind breakpoint), not the box's, so resize the window to see the drawer take over. Every shell
 *           has its own `mainId` and sidebar `label`, so ids and navigation landmarks stay unique (axe `duplicate-id`
 *           and `landmark-unique`). The page adds the icons it draws beyond the playground registry through a registry
 *           of its own, the sidebar toggle's included.
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0303 (decision 7); ADR 0312; ADR 0314; ADR 0060
 *          (right-to-left); WCAG 2.2 SC 1.3.1, 1.4.10, 2.4.1 and 2.4.3.
 */
import { defineIconRegistry } from "@stackra/icons";
import { IconRegistryProvider } from "@stackra/icons/react";
import {
  House,
  Inbox,
  Menu,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Users,
} from "@stackra/icons/react/lucide-icons";
import type { LayoutBreakpoint, NavigationItem } from "@stackra/ui/contracts";
import * as Ui from "@stackra/ui/react";
import { useState } from "react";
import { useLocation } from "react-router";

import { PageSection } from "#src/components/page-section";
import { AppShellRoute } from "#src/routes/app-shell/app-shell.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::app-shell.*` keys.
const STRINGS = {
  documentTitle: `${AppShellRoute.title} · Stackra Playground`,
  intro:
    "The app shell is the frame of the console: a sidebar column, a header and the page. The sidebar is the app's own node. Below the collapse breakpoint the column goes and the same sidebar opens in a drawer from the header's button. A real shell holds the page's one main landmark and a skip link first in the tab order; the shells here are embedded in this page, which already has both.",
  frame: "Frame",
  frameNote:
    "From 768 px up the sidebar is a column, and the sidebar's toggle folds it to an icon rail. Below 768 px the column is gone and the header's button opens it in a drawer. Resize the window to see both.",
  frameLabel: "Frame navigation",
  breakpoint: "Collapse breakpoint",
  breakpointNote:
    "collapseBelow names a Tailwind breakpoint. At xl the column shows from 1280 px; below that the same shell uses the drawer.",
  breakpointLabel: "Breakpoint navigation",
  noSidebar: "Without a sidebar",
  noSidebarNote: "A shell with no sidebar is a header over the page and draws no drawer.",
  arabic: "Arabic",
  arabicNote:
    "A right-to-left shell: the column sits at the right and the header's start is the right.",
  arabicLabel: "تنقل الإطار",
  live: "Try it",
  liveNote:
    "The button opens the drawer at any width. Choosing an entry or pressing Close, Escape or the backdrop closes it, and the page reports the state.",
  liveLabel: "Live navigation",
  state: (isOpen: boolean) => `Drawer: ${isOpen ? "open" : "closed"}`,
  openNavigation: "Open navigation",
  brand: "Acme",
  heading: "Orders",
  body: "The page sits in the shell's main region.",
  headingBare: "Dashboard",
  home: "Home",
  orders: "Orders",
  customers: "Customers",
  inbox: "Inbox",
  arabicBrand: "أكمي",
  arabicHeading: "الطلبات",
  arabicBody: "الصفحة داخل منطقة الإطار الرئيسية.",
  arabicHome: "الرئيسية",
  arabicOrders: "الطلبات",
  arabicCustomers: "العملاء",
} as const;

/** The icons this page draws beyond the playground registry, the sidebar's own toggle icons included. */
const PAGE_ICONS = defineIconRegistry({
  house: House,
  inbox: Inbox,
  menu: Menu,
  package: Package,
  "panel-left-close": PanelLeftClose,
  "panel-left-open": PanelLeftOpen,
  users: Users,
});

/** The box a shell sits in: an embedded shell fills its container, so it needs a height. */
const BOX = "h-80 overflow-hidden rounded-xl border border-border";

/** The class that hides the header's button where the column shows, written out so Tailwind finds each. */
const HIDDEN_FROM: Record<LayoutBreakpoint, string> = {
  sm: "sm:hidden",
  md: "md:hidden",
  lg: "lg:hidden",
  xl: "xl:hidden",
};

/** Props of {@link DemoShell}. */
interface DemoShellProps {
  /** The id of the shell's main region, unique on the page. */
  readonly mainId: string;
  /** The sidebar's landmark name, unique on the page. */
  readonly label?: string | undefined;
  /** The navigation entries, or none for a shell without a sidebar. */
  readonly items?: readonly NavigationItem[] | undefined;
  /** The brand text in the header and the sidebar. */
  readonly brand?: string | undefined;
  /** The page's heading, a level-3 heading under the section's. */
  readonly heading?: string | undefined;
  /** The page's sentence. */
  readonly body?: string | undefined;
  /** The breakpoint the shell collapses under; the default is the component's own. */
  readonly collapseBelow?: LayoutBreakpoint | undefined;
  /** True to show the header's button at every width, so the drawer can be tried on a wide window. */
  readonly isOpenerAlwaysShown?: boolean | undefined;
  /** Called with each new open state of the drawer. */
  readonly onOpenChange?: ((isOpen: boolean) => void) | undefined;
  /** The label of the header's button; left out, the shell has no button. */
  readonly openLabel?: string | undefined;
}

/** One embedded shell with a header holding the drawer's button, a sidebar and a page. */
function DemoShell({
  mainId,
  label,
  items,
  brand = STRINGS.brand,
  heading = STRINGS.heading,
  body = STRINGS.body,
  collapseBelow,
  isOpenerAlwaysShown = false,
  onOpenChange,
  openLabel = STRINGS.openNavigation,
}: DemoShellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const hiddenFrom = HIDDEN_FROM[collapseBelow ?? "md"];
  const change = (next: boolean) => {
    setIsOpen(next);
    onOpenChange?.(next);
  };

  return (
    <div className={BOX}>
      <Ui.AppShell
        isEmbedded
        mainId={mainId}
        isOpen={isOpen}
        onOpenChange={change}
        collapseBelow={collapseBelow}
        header={
          <header className="flex items-center gap-2 border-b border-border p-2">
            {items === undefined ? null : (
              <Ui.IconButton
                variant="ghost"
                icon="menu"
                label={openLabel}
                className={isOpenerAlwaysShown ? "" : hiddenFrom}
                onPress={() => change(true)}
              />
            )}
            <Ui.Text className="font-semibold">{brand}</Ui.Text>
          </header>
        }
        sidebar={
          items === undefined
            ? undefined
            : ({ isInDrawer }) => (
                <Ui.Sidebar
                  label={label}
                  items={items}
                  isCollapsible={!isInDrawer}
                  isCollapsed={!isInDrawer && isCollapsed}
                  onCollapsedChange={setIsCollapsed}
                />
              )
        }
      >
        <div className="grid gap-2 p-4">
          <Ui.Heading level={3}>{heading}</Ui.Heading>
          <Ui.Text tone="muted">
            <bdi>{body}</bdi>
          </Ui.Text>
        </div>
      </Ui.AppShell>
    </div>
  );
}

/** The App shell page. */
export function AppShell() {
  const { pathname, search } = useLocation();
  const [isLiveOpen, setIsLiveOpen] = useState(false);
  // A same-page anchor that keeps the scheme and language, which a bare `#id` would drop.
  const here = `${pathname}${search}`;
  const items = (id: string): readonly NavigationItem[] => [
    { id: "home", label: STRINGS.home, href: `${here}#${id}`, icon: "house" },
    {
      id: "orders",
      label: STRINGS.orders,
      href: `${here}#${id}`,
      icon: "package",
      isCurrent: true,
    },
    { id: "customers", label: STRINGS.customers, href: `${here}#${id}`, icon: "users" },
    { id: "inbox", label: STRINGS.inbox, href: `${here}#${id}`, icon: "inbox", badge: 12 },
  ];

  return (
    <IconRegistryProvider registry={PAGE_ICONS}>
      <article className="grid gap-10">
        <title>{STRINGS.documentTitle}</title>
        <header className="grid gap-2">
          <Ui.Heading level={1}>{AppShellRoute.title}</Ui.Heading>
          <Ui.Text className="max-w-prose">
            <bdi>{STRINGS.intro}</bdi>
          </Ui.Text>
        </header>

        <PageSection id="app-shell-frame" title={STRINGS.frame} note={STRINGS.frameNote}>
          <DemoShell
            mainId="app-shell-frame-main"
            label={STRINGS.frameLabel}
            items={items("app-shell-frame")}
          />
        </PageSection>

        <PageSection
          id="app-shell-breakpoint"
          title={STRINGS.breakpoint}
          note={STRINGS.breakpointNote}
        >
          <DemoShell
            mainId="app-shell-breakpoint-main"
            label={STRINGS.breakpointLabel}
            items={items("app-shell-breakpoint")}
            collapseBelow="xl"
          />
        </PageSection>

        <PageSection id="app-shell-bare" title={STRINGS.noSidebar} note={STRINGS.noSidebarNote}>
          <DemoShell mainId="app-shell-bare-main" heading={STRINGS.headingBare} />
        </PageSection>

        <PageSection id="app-shell-arabic" title={STRINGS.arabic} note={STRINGS.arabicNote}>
          <div lang="ar" dir="rtl">
            <DemoShell
              mainId="app-shell-arabic-main"
              label={STRINGS.arabicLabel}
              brand={STRINGS.arabicBrand}
              heading={STRINGS.arabicHeading}
              body={STRINGS.arabicBody}
              items={[
                {
                  id: "home",
                  label: STRINGS.arabicHome,
                  href: `${here}#app-shell-arabic`,
                  icon: "house",
                },
                {
                  id: "orders",
                  label: STRINGS.arabicOrders,
                  href: `${here}#app-shell-arabic`,
                  icon: "package",
                  isCurrent: true,
                },
                {
                  id: "customers",
                  label: STRINGS.arabicCustomers,
                  href: `${here}#app-shell-arabic`,
                  icon: "users",
                },
              ]}
            />
          </div>
        </PageSection>

        <PageSection id="app-shell-live" title={STRINGS.live} note={STRINGS.liveNote}>
          <div className="grid gap-3">
            <DemoShell
              mainId="app-shell-live-main"
              label={STRINGS.liveLabel}
              items={items("app-shell-live")}
              isOpenerAlwaysShown
              onOpenChange={setIsLiveOpen}
            />
            <output aria-live="polite" data-testid="drawer-state">
              <bdi>{STRINGS.state(isLiveOpen)}</bdi>
            </output>
          </div>
        </PageSection>
      </article>
    </IconRegistryProvider>
  );
}
