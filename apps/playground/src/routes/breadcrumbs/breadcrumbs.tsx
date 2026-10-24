/**
 * Stackra file contract:
 * Purpose: the page of the breadcrumbs route: a trail of links ending in the current page, a single step, a long trail
 *          in a narrow column that wraps, a custom separator, press-only steps, an Arabic trail whose chevrons turn,
 *          and a live trail whose steps cut it back and whose button goes one level deeper, all from
 *          `@stackra/ui/react` with real props.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n, text in another language
 *          carries its own `lang`. Every trail on the page has its own `label`, so each navigation landmark is named
 *          once (axe `landmark-unique`). The hrefs are same-page anchors, so the trail never leaves the page.
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0303 (decision 7); ADR 0313; ADR 0060 (right-to-left);
 *          WCAG 2.2 SC 2.4.8.
 */
import type { BreadcrumbItem } from "@stackra/ui/contracts";
import * as Ui from "@stackra/ui/react";
import { useState } from "react";
import { useLocation } from "react-router";

import { PageSection } from "#src/components/page-section";
import { BreadcrumbsRoute } from "#src/routes/breadcrumbs/breadcrumbs.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::breadcrumbs.*` keys.
const STRINGS = {
  documentTitle: `${BreadcrumbsRoute.title} · Stackra Playground`,
  intro:
    "Breadcrumbs show where the page sits in a hierarchy: every step but the last is a link, and the last is the current page. The app builds the trail from its own location, and a step's href reaches the router through the nearest RouterProvider.",
  trail: "Trail",
  trailNote:
    "Three steps. The last is the current page: it is text, announced as the current page, and has no link.",
  trailLabel: "Order location",
  home: "Home",
  orders: "Orders",
  order: "Order 1042",
  invoice: "Invoice",
  lengths: "Lengths",
  lengthsNote: "A single step, and a long trail in a narrow column, where the steps wrap.",
  singleLabel: "Single step",
  longLabel: "Long trail",
  settings: "Settings",
  team: "Team",
  roles: "Roles and permissions",
  editor: "Editor",
  separator: "Separator",
  separatorNote: "A slash instead of the chevron, passed through to HeroUI's own `separator` prop.",
  separatorLabel: "Slash separator",
  pressOnly: "Press only",
  pressOnlyNote:
    "Steps with a handler and no href are press-only links: the page counts the presses.",
  pressOnlyLabel: "Press-only trail",
  pressCount: (count: number) => `Pressed ${count} ${count === 1 ? "time" : "times"}.`,
  live: "Try it",
  liveNote:
    "Press a step to cut the trail back to it; the button goes one level deeper. The page names the current step.",
  liveLabel: "Drill-down trail",
  deeper: "Go one level deeper",
  reset: "Back to the start",
  current: (name: string) => `Current page: ${name}`,
  arabic: "Arabic",
  arabicNote: "A right-to-left trail: the steps run from the right and the chevrons turn.",
  arabicLabel: "مسار الصفحة",
  arabicHome: "الرئيسية",
  arabicOrders: "الطلبات",
  arabicOrder: "الطلب 1042",
} as const;

/** The trail of the drill-down example, from the root to its deepest step. */
const FULL_TRAIL: readonly BreadcrumbItem[] = [
  { id: "home", label: STRINGS.home },
  { id: "orders", label: STRINGS.orders },
  { id: "order", label: STRINGS.order },
  { id: "invoice", label: STRINGS.invoice },
];

/** The Breadcrumbs page. */
export function Breadcrumbs() {
  const { pathname, search } = useLocation();
  const [depth, setDepth] = useState(FULL_TRAIL.length);
  const [presses, setPresses] = useState(0);
  // A same-page anchor that keeps the scheme and language, which a bare `#id` would drop.
  const here = `${pathname}${search}`;
  const anchor = (id: string) => `${here}#${id}`;
  const live: readonly BreadcrumbItem[] = FULL_TRAIL.slice(0, depth).map((item, index) => ({
    ...item,
    onPress: () => setDepth(index + 1),
  }));
  const currentName = live.at(-1)?.label ?? STRINGS.home;

  return (
    <article className="grid gap-10">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <Ui.Heading level={1}>{BreadcrumbsRoute.title}</Ui.Heading>
        <Ui.Text className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </Ui.Text>
      </header>

      <PageSection id="breadcrumbs-trail" title={STRINGS.trail} note={STRINGS.trailNote}>
        <Ui.Breadcrumbs
          label={STRINGS.trailLabel}
          items={[
            { id: "home", label: STRINGS.home, href: anchor("breadcrumbs-trail") },
            { id: "orders", label: STRINGS.orders, href: anchor("breadcrumbs-trail") },
            { id: "order", label: STRINGS.order },
          ]}
        />
      </PageSection>

      <PageSection id="breadcrumbs-lengths" title={STRINGS.lengths} note={STRINGS.lengthsNote}>
        <Ui.Breadcrumbs label={STRINGS.singleLabel} items={[{ id: "home", label: STRINGS.home }]} />
        <div className="max-w-xs">
          <Ui.Breadcrumbs
            label={STRINGS.longLabel}
            items={[
              { id: "home", label: STRINGS.home, href: anchor("breadcrumbs-lengths") },
              { id: "settings", label: STRINGS.settings, href: anchor("breadcrumbs-lengths") },
              { id: "team", label: STRINGS.team, href: anchor("breadcrumbs-lengths") },
              { id: "roles", label: STRINGS.roles, href: anchor("breadcrumbs-lengths") },
              { id: "editor", label: STRINGS.editor },
            ]}
          />
        </div>
      </PageSection>

      <PageSection
        id="breadcrumbs-separator"
        title={STRINGS.separator}
        note={STRINGS.separatorNote}
      >
        <Ui.Breadcrumbs
          label={STRINGS.separatorLabel}
          separator="/"
          items={[
            { id: "home", label: STRINGS.home, href: anchor("breadcrumbs-separator") },
            { id: "orders", label: STRINGS.orders, href: anchor("breadcrumbs-separator") },
            { id: "order", label: STRINGS.order },
          ]}
        />
      </PageSection>

      <PageSection id="breadcrumbs-press" title={STRINGS.pressOnly} note={STRINGS.pressOnlyNote}>
        <Ui.Breadcrumbs
          label={STRINGS.pressOnlyLabel}
          items={[
            { id: "home", label: STRINGS.home, onPress: () => setPresses((count) => count + 1) },
            {
              id: "orders",
              label: STRINGS.orders,
              onPress: () => setPresses((count) => count + 1),
            },
            { id: "order", label: STRINGS.order },
          ]}
        />
        <output aria-live="polite" data-testid="press-count">
          <bdi>{STRINGS.pressCount(presses)}</bdi>
        </output>
      </PageSection>

      <PageSection id="breadcrumbs-live" title={STRINGS.live} note={STRINGS.liveNote}>
        <Ui.Breadcrumbs label={STRINGS.liveLabel} items={live} />
        <div className="flex flex-wrap items-center gap-3">
          <Ui.Button
            variant="secondary"
            isDisabled={depth >= FULL_TRAIL.length}
            onPress={() => setDepth((value) => Math.min(value + 1, FULL_TRAIL.length))}
          >
            {STRINGS.deeper}
          </Ui.Button>
          <Ui.Button variant="tertiary" onPress={() => setDepth(1)}>
            {STRINGS.reset}
          </Ui.Button>
        </div>
        <output aria-live="polite" data-testid="current-page">
          <bdi>{STRINGS.current(currentName)}</bdi>
        </output>
      </PageSection>

      <PageSection id="breadcrumbs-arabic" title={STRINGS.arabic} note={STRINGS.arabicNote}>
        <div lang="ar" dir="rtl">
          <Ui.Breadcrumbs
            label={STRINGS.arabicLabel}
            items={[
              { id: "home", label: STRINGS.arabicHome, href: anchor("breadcrumbs-arabic") },
              { id: "orders", label: STRINGS.arabicOrders, href: anchor("breadcrumbs-arabic") },
              { id: "order", label: STRINGS.arabicOrder },
            ]}
          />
        </div>
      </PageSection>
    </article>
  );
}
