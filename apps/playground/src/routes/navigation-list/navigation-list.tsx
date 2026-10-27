/**
 * Stackra file contract:
 * Purpose: the page of the navigation-list route: a flat list with icons, the current place (a leaf, and an entry that
 *          only holds it), a group heading over its entries and a link with nested entries, badges (and none for zero),
 *          a disabled and a press-only entry, shortcut tooltips, the compact icon rail, an Arabic list in a
 *          right-to-left block, and a live list whose press-only entries move the current place, all from
 *          `@stackra/ui/react` with real props.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n, text in another language carries
 *           its own `lang`. Every list on the page has its own `label`, so each navigation landmark is named once (axe
 *           `landmark-unique`). The hrefs are same-page anchors, so a list never leaves the page. The page adds the
 *           icons it draws beyond the playground registry through a registry of its own.
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0303 (decision 7); ADR 0317; ADR 0060 (right-to-left); WCAG
 *          2.2 SC 1.3.1, 2.4.7 and 4.1.2.
 */
import { defineIconRegistry } from "@stackra/icons";
import { IconRegistryProvider } from "@stackra/icons/react";
import { House, Inbox, Package, Users } from "@stackra/icons/react/lucide-icons";
import type { NavigationItem } from "@stackra/ui/contracts";
import { Heading, NavigationList as UiNavigationList, Text } from "@stackra/ui/react";
import { useState } from "react";
import { useLocation } from "react-router";

import { PageSection } from "#src/components/page-section";
import { NavigationListRoute } from "#src/routes/navigation-list/navigation-list.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::navigation-list.*` keys.
const STRINGS = {
  documentTitle: `${NavigationListRoute.title} · Stackra Playground`,
  intro:
    "A navigation list is the places of an app as a named navigation landmark. An entry with somewhere to go is a link; an entry with only children is a group heading. The app sets which entry is current, and a screen reader announces it as the current page.",
  basics: "Basics",
  basicsNote: "Links with an icon before the label.",
  basicsLabel: "Basic navigation",
  home: "Home",
  orders: "Orders",
  customers: "Customers",
  inbox: "Inbox",
  current: "Current page",
  currentNote:
    "The current entry is filled, bold and marked at its start, and is announced as the current page. A link that only holds the current entry is announced as current too.",
  currentLabel: "Navigation with the current page",
  holdingLabel: "Navigation holding the current page",
  groups: "Groups and nesting",
  groupsNote:
    "An entry with only children is a heading that names the list under it. An entry with a link keeps its children nested under it.",
  groupsLabel: "Grouped navigation",
  settings: "Settings",
  profile: "Profile",
  billing: "Billing",
  returns: "Returns",
  shipments: "Shipments",
  badges: "Badges",
  badgesNote: "A count after the label. A badge of zero or an empty text draws nothing.",
  badgesLabel: "Navigation with badges",
  states: "Disabled and press-only",
  statesNote:
    "A disabled entry is dimmed and refuses the pointer and the keyboard. An entry with only a press action is a link that runs the action; the page counts the presses.",
  statesLabel: "Navigation with a disabled entry",
  archive: "Archive",
  runReport: "Run report",
  pressCount: (count: number) => `Pressed ${count} ${count === 1 ? "time" : "times"}.`,
  shortcuts: "Shortcuts",
  shortcutsNote:
    "A shortcut appears in a tooltip when an entry is hovered or focused by keyboard. The app binds the key.",
  shortcutsLabel: "Navigation with shortcuts",
  compact: "Compact",
  compactNote:
    "The icon rail: labels leave the screen and stay each link's name, and a tooltip shows the label on hover and keyboard focus.",
  compactLabel: "Compact navigation",
  arabic: "Arabic",
  arabicNote: "A right-to-left list: the icons and the current mark sit at the right.",
  arabicLabel: "قائمة التنقل",
  arabicHome: "الرئيسية",
  arabicOrders: "الطلبات",
  arabicCustomers: "العملاء",
  live: "Try it",
  liveNote: "Press an entry: it becomes the current place and the page reports it.",
  liveLabel: "Live navigation",
  currentPage: (name: string) => `Current page: ${name}`,
} as const;

/** The icons this page draws beyond the playground registry. */
const PAGE_ICONS = defineIconRegistry({
  house: House,
  inbox: Inbox,
  package: Package,
  users: Users,
});

/** The entries of the live example, each with the text the page reports when it is current. */
const LIVE = [
  { id: "home", label: STRINGS.home, icon: "house" },
  { id: "orders", label: STRINGS.orders, icon: "package" },
  { id: "customers", label: STRINGS.customers, icon: "users" },
  { id: "inbox", label: STRINGS.inbox, icon: "inbox" },
] as const;

/** The Navigation list page. */
export function NavigationList() {
  const { pathname, search } = useLocation();
  const [presses, setPresses] = useState(0);
  const [currentId, setCurrentId] = useState<string>("home");
  // A same-page anchor that keeps the scheme and language, which a bare `#id` would drop.
  const here = `${pathname}${search}`;
  const anchor = (id: string) => `${here}#${id}`;
  const flat = (id: string): readonly NavigationItem[] => [
    { id: "home", label: STRINGS.home, href: anchor(id), icon: "house" },
    { id: "orders", label: STRINGS.orders, href: anchor(id), icon: "package" },
    { id: "customers", label: STRINGS.customers, href: anchor(id), icon: "users" },
  ];
  const live: readonly NavigationItem[] = LIVE.map((entry) => ({
    ...entry,
    isCurrent: entry.id === currentId,
    onPress: () => setCurrentId(entry.id),
  }));
  const currentName = LIVE.find((entry) => entry.id === currentId)?.label ?? STRINGS.home;

  return (
    <IconRegistryProvider registry={PAGE_ICONS}>
      <article className="grid gap-10">
        <title>{STRINGS.documentTitle}</title>
        <header className="grid gap-2">
          <Heading level={1}>{NavigationListRoute.title}</Heading>
          <Text className="max-w-prose">
            <bdi>{STRINGS.intro}</bdi>
          </Text>
        </header>

        <PageSection id="navigation-list-basics" title={STRINGS.basics} note={STRINGS.basicsNote}>
          <div className="max-w-xs">
            <UiNavigationList label={STRINGS.basicsLabel} items={flat("navigation-list-basics")} />
          </div>
        </PageSection>

        <PageSection
          id="navigation-list-current"
          title={STRINGS.current}
          note={STRINGS.currentNote}
        >
          <div className="grid max-w-xs gap-6">
            <UiNavigationList
              label={STRINGS.currentLabel}
              items={[
                {
                  id: "home",
                  label: STRINGS.home,
                  href: anchor("navigation-list-current"),
                  icon: "house",
                },
                {
                  id: "orders",
                  label: STRINGS.orders,
                  href: anchor("navigation-list-current"),
                  icon: "package",
                  isCurrent: true,
                },
                {
                  id: "customers",
                  label: STRINGS.customers,
                  href: anchor("navigation-list-current"),
                  icon: "users",
                },
              ]}
            />
            <UiNavigationList
              label={STRINGS.holdingLabel}
              items={[
                {
                  id: "orders",
                  label: STRINGS.orders,
                  href: anchor("navigation-list-current"),
                  icon: "package",
                  children: [
                    {
                      id: "returns",
                      label: STRINGS.returns,
                      href: anchor("navigation-list-current"),
                      isCurrent: true,
                    },
                  ],
                },
              ]}
            />
          </div>
        </PageSection>

        <PageSection id="navigation-list-groups" title={STRINGS.groups} note={STRINGS.groupsNote}>
          <div className="max-w-xs">
            <UiNavigationList
              label={STRINGS.groupsLabel}
              items={[
                {
                  id: "orders",
                  label: STRINGS.orders,
                  href: anchor("navigation-list-groups"),
                  icon: "package",
                  children: [
                    {
                      id: "returns",
                      label: STRINGS.returns,
                      href: anchor("navigation-list-groups"),
                    },
                    {
                      id: "shipments",
                      label: STRINGS.shipments,
                      href: anchor("navigation-list-groups"),
                    },
                  ],
                },
                {
                  id: "settings",
                  label: STRINGS.settings,
                  children: [
                    {
                      id: "profile",
                      label: STRINGS.profile,
                      href: anchor("navigation-list-groups"),
                    },
                    {
                      id: "billing",
                      label: STRINGS.billing,
                      href: anchor("navigation-list-groups"),
                    },
                  ],
                },
              ]}
            />
          </div>
        </PageSection>

        <PageSection id="navigation-list-badges" title={STRINGS.badges} note={STRINGS.badgesNote}>
          <div className="max-w-xs">
            <UiNavigationList
              label={STRINGS.badgesLabel}
              items={[
                {
                  id: "inbox",
                  label: STRINGS.inbox,
                  href: anchor("navigation-list-badges"),
                  icon: "inbox",
                  badge: 12,
                },
                {
                  id: "orders",
                  label: STRINGS.orders,
                  href: anchor("navigation-list-badges"),
                  icon: "package",
                  badge: "New",
                },
                {
                  id: "customers",
                  label: STRINGS.customers,
                  href: anchor("navigation-list-badges"),
                  icon: "users",
                  badge: 0,
                },
              ]}
            />
          </div>
        </PageSection>

        <PageSection id="navigation-list-states" title={STRINGS.states} note={STRINGS.statesNote}>
          <div className="grid max-w-xs gap-3">
            <UiNavigationList
              label={STRINGS.statesLabel}
              items={[
                {
                  id: "home",
                  label: STRINGS.home,
                  href: anchor("navigation-list-states"),
                  icon: "house",
                },
                {
                  id: "archive",
                  label: STRINGS.archive,
                  href: anchor("navigation-list-states"),
                  icon: "package",
                  isDisabled: true,
                },
                {
                  id: "report",
                  label: STRINGS.runReport,
                  icon: "users",
                  onPress: () => setPresses((count) => count + 1),
                },
              ]}
            />
            <output aria-live="polite" data-testid="press-count">
              <bdi>{STRINGS.pressCount(presses)}</bdi>
            </output>
          </div>
        </PageSection>

        <PageSection
          id="navigation-list-shortcuts"
          title={STRINGS.shortcuts}
          note={STRINGS.shortcutsNote}
        >
          <div className="max-w-xs">
            <UiNavigationList
              label={STRINGS.shortcutsLabel}
              items={[
                {
                  id: "home",
                  label: STRINGS.home,
                  href: anchor("navigation-list-shortcuts"),
                  icon: "house",
                  shortcut: "G then H",
                },
                {
                  id: "orders",
                  label: STRINGS.orders,
                  href: anchor("navigation-list-shortcuts"),
                  icon: "package",
                  shortcut: "G then O",
                },
              ]}
            />
          </div>
        </PageSection>

        <PageSection
          id="navigation-list-compact"
          title={STRINGS.compact}
          note={STRINGS.compactNote}
        >
          <div className="w-20 rounded-xl border border-border p-2">
            <UiNavigationList
              isCompact
              label={STRINGS.compactLabel}
              items={[
                {
                  id: "home",
                  label: STRINGS.home,
                  href: anchor("navigation-list-compact"),
                  icon: "house",
                },
                {
                  id: "orders",
                  label: STRINGS.orders,
                  href: anchor("navigation-list-compact"),
                  icon: "package",
                  isCurrent: true,
                  badge: 3,
                },
                {
                  id: "customers",
                  label: STRINGS.customers,
                  href: anchor("navigation-list-compact"),
                  icon: "users",
                },
              ]}
            />
          </div>
        </PageSection>

        <PageSection id="navigation-list-arabic" title={STRINGS.arabic} note={STRINGS.arabicNote}>
          <div lang="ar" dir="rtl" className="max-w-xs">
            <UiNavigationList
              label={STRINGS.arabicLabel}
              items={[
                {
                  id: "home",
                  label: STRINGS.arabicHome,
                  href: anchor("navigation-list-arabic"),
                  icon: "house",
                },
                {
                  id: "orders",
                  label: STRINGS.arabicOrders,
                  href: anchor("navigation-list-arabic"),
                  icon: "package",
                  isCurrent: true,
                },
                {
                  id: "customers",
                  label: STRINGS.arabicCustomers,
                  href: anchor("navigation-list-arabic"),
                  icon: "users",
                },
              ]}
            />
          </div>
        </PageSection>

        <PageSection id="navigation-list-live" title={STRINGS.live} note={STRINGS.liveNote}>
          <div className="grid max-w-xs gap-3">
            <UiNavigationList label={STRINGS.liveLabel} items={live} />
            <output aria-live="polite" data-testid="current-page">
              <bdi>{STRINGS.currentPage(currentName)}</bdi>
            </output>
          </div>
        </PageSection>
      </article>
    </IconRegistryProvider>
  );
}
