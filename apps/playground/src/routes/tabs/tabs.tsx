/**
 * Stackra file contract:
 * Purpose: the page of the tabs route: tabs with a name, both variants, both orientations, a disabled tab and a
 *          disabled list, the empty and loading states, and a live example whose selection is held by the page and can
 *          be changed from outside, all from `@stackra/ui/react` with real props.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n.
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0313; ADR 0060 (light, dark, RTL).
 */
import * as Ui from "@stackra/ui/react";
import { useState } from "react";

import { PageSection } from "#src/components/page-section";
import { TabsRoute } from "#src/routes/tabs/tabs.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::tabs.*` keys.
const STRINGS = {
  documentTitle: `${TabsRoute.title} · Stackra Playground`,
  intro:
    "Tabs show one panel of several at a time. The selection is a list of one id, so it reads the same as a table's or a list's. Arrow keys move between tabs and select as they go; Home and End jump to the ends. On a phone the tab row scrolls, and vertical tabs read as horizontal.",
  basics: "Basics",
  basicsNote:
    "A tab list named for assistive technology, and one with no name, which is fine when it is the only one on the page.",
  basicsLabel: "Order sections",
  variants: "Variants",
  variantsNote:
    "Primary is a raised pill on a tinted track; secondary is flat, for tabs that sit on a card.",
  primary: "Primary tabs",
  secondary: "Secondary tabs",
  orientation: "Orientation",
  orientationNote: "Horizontal is the default. Vertical tabs run down the start edge on the web.",
  horizontal: "Horizontal tabs",
  vertical: "Vertical tabs",
  states: "States",
  statesNote:
    "A disabled tab is shown but skipped by the arrow keys and refused by a press; a disabled list refuses every tab.",
  disabledTab: "One disabled tab",
  disabledList: "Disabled tabs",
  empty: "Empty and loading",
  emptyNote:
    "With no tabs the component shows the empty state you pass, or one named busy spinner while it loads.",
  emptyMessage: "No sections yet.",
  loadingLabel: "Loading sections",
  live: "Try it",
  liveNote:
    "Pick a tab, or use the buttons: the page holds the selection and reports it, and a press on the buttons moves the tabs.",
  liveLabel: "Controlled tabs",
  showHistory: "Show history",
  showOverview: "Show overview",
  selected: (keys: readonly string[]) =>
    `Selected: ${keys.length === 0 ? "none" : keys.join(", ")}`,
} as const;

/** The tabs of most samples. */
const SECTIONS = [
  { id: "overview", label: "Overview", content: "A summary of the order and where it ships." },
  { id: "items", label: "Items", content: "The products on the order, one line each." },
  { id: "history", label: "History", content: "Every change to the order, newest first." },
] as const;

/** The same tabs with one refused. */
const SECTIONS_ONE_DISABLED = [
  { id: "overview", label: "Overview", content: "A summary of the order and where it ships." },
  {
    id: "items",
    label: "Items",
    content: "The products on the order, one line each.",
    isDisabled: true,
  },
  { id: "history", label: "History", content: "Every change to the order, newest first." },
] as const;

/** The grid that lays the samples out in a wrapping row. */
const ROW = "flex flex-wrap items-start gap-8";

/** The Tabs page. */
export function Tabs() {
  const [picked, setPicked] = useState<readonly string[]>(["overview"]);

  return (
    <article className="grid gap-10">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <Ui.Heading level={1}>{TabsRoute.title}</Ui.Heading>
        <Ui.Text className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </Ui.Text>
      </header>

      <PageSection id="tabs-basics" title={STRINGS.basics} note={STRINGS.basicsNote}>
        <div className={ROW}>
          <Ui.Tabs items={SECTIONS} label={STRINGS.basicsLabel} />
          <Ui.Tabs items={SECTIONS} />
        </div>
      </PageSection>

      <PageSection id="tabs-variants" title={STRINGS.variants} note={STRINGS.variantsNote}>
        <div className={ROW}>
          <Ui.Tabs items={SECTIONS} label={STRINGS.primary} variant="primary" />
          <Ui.Surface variant="secondary" className="p-4">
            <Ui.Tabs items={SECTIONS} label={STRINGS.secondary} variant="secondary" />
          </Ui.Surface>
        </div>
      </PageSection>

      <PageSection id="tabs-orientation" title={STRINGS.orientation} note={STRINGS.orientationNote}>
        <div className={ROW}>
          <Ui.Tabs items={SECTIONS} label={STRINGS.horizontal} orientation="horizontal" />
          <Ui.Tabs items={SECTIONS} label={STRINGS.vertical} orientation="vertical" />
        </div>
      </PageSection>

      <PageSection id="tabs-states" title={STRINGS.states} note={STRINGS.statesNote}>
        <div className={ROW}>
          <Ui.Tabs items={SECTIONS_ONE_DISABLED} label={STRINGS.disabledTab} />
          <Ui.Tabs items={SECTIONS} label={STRINGS.disabledList} isDisabled />
        </div>
      </PageSection>

      <PageSection id="tabs-empty" title={STRINGS.empty} note={STRINGS.emptyNote}>
        <div className={ROW}>
          <Ui.Tabs items={[]} emptyState={<Ui.Text tone="muted">{STRINGS.emptyMessage}</Ui.Text>} />
          <Ui.Tabs items={[]} isLoading loadingLabel={STRINGS.loadingLabel} />
        </div>
      </PageSection>

      <PageSection id="tabs-live" title={STRINGS.live} note={STRINGS.liveNote}>
        <Ui.Tabs
          items={SECTIONS}
          label={STRINGS.liveLabel}
          selectedKeys={picked}
          onSelectionChange={setPicked}
        />
        <Ui.Text role="status" data-testid="tabs-selected" tone="muted">
          {STRINGS.selected(picked)}
        </Ui.Text>
        <div className="flex flex-wrap gap-2">
          <Ui.Button variant="secondary" onPress={() => setPicked(["history"])}>
            {STRINGS.showHistory}
          </Ui.Button>
          <Ui.Button variant="secondary" onPress={() => setPicked(["overview"])}>
            {STRINGS.showOverview}
          </Ui.Button>
        </div>
      </PageSection>
    </article>
  );
}
