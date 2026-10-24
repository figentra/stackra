/**
 * Stackra file contract:
 * Purpose: the page of the screen route: the screen container with each edge it can keep clear of the system's own
 *          parts (all, top, bottom, sides, none), the scrolling screen and the one that only holds its content, an
 *          Arabic screen in a right-to-left block, and a live screen whose scrolling and edges are switched by the
 *          visitor while the page reports them, all from `@stackra/ui/react` with real props. The page says that this is
 *          the web form (a plain container) and that the phone form, with safe areas and keyboard avoidance, is native.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n, text in another language carries
 *           its own `lang`. Every sample is an embedded screen (a `div`), because the page already holds the one `main`.
 *           A desktop browser has no safe-area inset, so the edges draw no visible gap here: the page says so, and the
 *           unit tests check the classes that carry the insets on a device.
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0303 (decision 7); ADR 0314 (decisions 5 and 7); ADR 0060
 *          (right-to-left); WCAG 2.2 SC 1.3.1, 1.4.10, 2.1.1 and 4.1.3.
 */
import type { ScreenEdge } from "@stackra/ui/contracts";
import * as Ui from "@stackra/ui/react";
import { useState, type ReactNode } from "react";

import { PageSection } from "#src/components/page-section";
import { ScreenRoute } from "#src/routes/screen/screen.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::screen.*` keys.
const STRINGS = {
  documentTitle: `${ScreenRoute.title} · Stackra Playground`,
  intro:
    "A screen is the one container a screen's content sits in. On a phone it keeps clear of the status bar, the notch and the home indicator, scrolls when the content is tall and lifts a focused field above the keyboard. On the web it is a plain main landmark with the same props: it keeps clear of a desktop title bar and of a device's safe area, and ignores the keyboard, because the browser handles that. Use it or the app shell, never both.",
  edges: "Edges",
  edgesNote:
    "Each sample keeps clear of the edges it is given, with padding taken from the device's safe area or the desktop title bar. A desktop browser has none, so the gaps here are zero; an installed app or a phone shows them.",
  all: "All edges, the default",
  top: "Top only",
  bottom: "Bottom only",
  sides: "Sides only",
  none: "No edges, as under a navigator's header and tab bar",
  scrolling: "Scrolling",
  scrollingNote:
    "A screen scrolls its own content by default. Turn scrolling off for a screen that only holds a fixed layout.",
  scrolls: "Scrolls, the default",
  holds: "Holds its content, not scrollable",
  arabic: "Arabic",
  arabicNote:
    "A right-to-left screen: the content starts at the right, and the side insets stay on the real sides of the device.",
  live: "Try it",
  liveNote:
    "Switch scrolling and choose the edges. The screen below follows, and the page reports what it is set to.",
  scrollSwitch: "Scrolls",
  edgesGroup: "Edges kept clear",
  press: "Press me",
  pressed: (count: number) =>
    count === 0 ? "Not pressed yet." : count === 1 ? "Pressed once." : `Pressed ${count} times.`,
  settings: (isScrollable: boolean, edges: readonly string[]) =>
    `Scrolling is ${isScrollable ? "on" : "off"}. ${
      edges.length === 0 ? "No edges are kept clear." : `Kept clear: ${edges.join(", ")}.`
    }`,
  line: (index: number) => `Order line ${index + 1}`,
  card: "The screen's content",
  arabicCard: "محتوى الشاشة",
  arabicLine: (index: number) => `بند الطلب ${index + 1}`,
  arabicPress: "اضغط هنا",
} as const;

/** The edges the contract names, as the options of the live group. */
const EDGE_OPTIONS = [
  { value: "top", label: "Top" },
  { value: "bottom", label: "Bottom" },
  { value: "sides", label: "Sides" },
] as const;

/** The box a screen sits in, tall enough to show a gap and to need scrolling. */
const BOX = "h-36 rounded-xl border border-border";

/** The grid that lays the samples out in one column of cards. */
const GRID = "grid gap-4";

/** A caption and the sample it describes, as one list item. */
function Sample({ caption, children }: { readonly caption: string; readonly children: ReactNode }) {
  return (
    <li className="grid content-start gap-2">
      <Ui.Text tone="muted" type="small">
        {caption}
      </Ui.Text>
      {children}
    </li>
  );
}

/** A few lines of order text, tall enough to scroll in a short box. */
function Lines({
  count,
  line,
}: {
  readonly count: number;
  readonly line: (index: number) => string;
}) {
  return (
    <ul className="grid gap-1 p-3">
      {Array.from({ length: count }, (_, index) => (
        <li key={index}>
          <Ui.Text>{line(index)}</Ui.Text>
        </li>
      ))}
    </ul>
  );
}

/** One embedded screen over a short card, kept clear of the edges it is given. */
function EdgesSample({
  caption,
  edges,
  sample,
}: {
  readonly caption: string;
  readonly edges: readonly ScreenEdge[];
  readonly sample: string;
}) {
  return (
    <Sample caption={caption}>
      <Ui.Screen isEmbedded edges={edges} className={BOX} data-sample={sample}>
        <Ui.Surface className="m-3 p-3">
          <Ui.Text>{STRINGS.card}</Ui.Text>
        </Ui.Surface>
      </Ui.Screen>
    </Sample>
  );
}

/** The Screen page. */
export function Screen() {
  const [isScrollable, setIsScrollable] = useState(true);
  const [edges, setEdges] = useState<readonly string[]>(["top", "bottom", "sides"]);
  const [pressed, setPressed] = useState(0);

  return (
    <article className="grid gap-10">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <Ui.Heading level={1}>{ScreenRoute.title}</Ui.Heading>
        <Ui.Text className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </Ui.Text>
      </header>

      <PageSection id="screen-edges" title={STRINGS.edges} note={STRINGS.edgesNote}>
        <ul className={GRID}>
          <EdgesSample caption={STRINGS.all} edges={["top", "bottom", "sides"]} sample="all" />
          <EdgesSample caption={STRINGS.top} edges={["top"]} sample="top" />
          <EdgesSample caption={STRINGS.bottom} edges={["bottom"]} sample="bottom" />
          <EdgesSample caption={STRINGS.sides} edges={["sides"]} sample="sides" />
          <EdgesSample caption={STRINGS.none} edges={[]} sample="none" />
        </ul>
      </PageSection>

      <PageSection id="screen-scrolling" title={STRINGS.scrolling} note={STRINGS.scrollingNote}>
        <ul className={GRID}>
          <Sample caption={STRINGS.scrolls}>
            <Ui.Screen isEmbedded className={BOX} data-sample="scrolls">
              <div className="p-3">
                <Ui.Button size="sm">{STRINGS.press}</Ui.Button>
              </div>
              <Lines count={12} line={STRINGS.line} />
            </Ui.Screen>
          </Sample>
          <Sample caption={STRINGS.holds}>
            <Ui.Screen isEmbedded isScrollable={false} className={BOX} data-sample="holds">
              <Lines count={12} line={STRINGS.line} />
            </Ui.Screen>
          </Sample>
        </ul>
      </PageSection>

      <PageSection id="screen-arabic" title={STRINGS.arabic} note={STRINGS.arabicNote}>
        <div dir="rtl" lang="ar" data-sample="arabic">
          <Ui.Screen isEmbedded className={BOX}>
            <div className="p-3">
              <Ui.Button size="sm">{STRINGS.arabicPress}</Ui.Button>
            </div>
            <Ui.Text className="px-3">{STRINGS.arabicCard}</Ui.Text>
            <Lines count={8} line={STRINGS.arabicLine} />
          </Ui.Screen>
        </div>
      </PageSection>

      <PageSection id="screen-live" title={STRINGS.live} note={STRINGS.liveNote}>
        <div className="grid gap-4">
          <div className="flex flex-wrap items-start gap-6">
            <Ui.Switch
              label={STRINGS.scrollSwitch}
              value={isScrollable}
              onChange={setIsScrollable}
            />
            <Ui.CheckboxGroup
              label={STRINGS.edgesGroup}
              options={EDGE_OPTIONS}
              value={edges}
              onChange={setEdges}
            />
          </div>
          <Ui.Screen
            isEmbedded
            isScrollable={isScrollable}
            edges={edges as readonly ScreenEdge[]}
            className={BOX}
            data-sample="live"
          >
            <div className="p-3">
              <Ui.Button size="sm" onPress={() => setPressed((count) => count + 1)}>
                {STRINGS.press}
              </Ui.Button>
            </div>
            <Lines count={12} line={STRINGS.line} />
          </Ui.Screen>
          <div className="grid gap-1" data-sample="live-status">
            <Ui.Text role="status" tone="muted">
              {STRINGS.settings(isScrollable, edges)}
            </Ui.Text>
            <Ui.Text role="status" tone="muted">
              {STRINGS.pressed(pressed)}
            </Ui.Text>
          </div>
        </div>
      </PageSection>
    </article>
  );
}
