/**
 * Stackra file contract:
 * Purpose: the page of the icon route: every Icon size, tone, decorative and labelled use, the directional icons that
 *          mirror in right-to-left beside ones that never do, an alias and an app's own SVG component drawn by name
 *          through Icon, the SVG props that pass through, and a live sample whose size and tone a button cycles.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n. Icons are drawn by name from
 *          the registry in `components/playground-icons`; the page nests a provider for its own custom icon.
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0303 (decisions 7 and 10); ADR 0060 (right-to-left).
 */
import { defineIconRegistry } from "@stackra/icons";
import type { IconComponentProps, IconName } from "@stackra/icons/contracts";
import { IconRegistryProvider } from "@stackra/icons/react";
import { ICON_SIZES } from "@stackra/ui";
import { Size, TextTone } from "@stackra/ui/contracts";
import { Button, Heading, Icon as UiIcon, Text } from "@stackra/ui/react";
import { useState, type ReactNode } from "react";

import { PageSection } from "#src/components/page-section";
import { IconRoute } from "#src/routes/icon/icon.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::icon.*` keys.
const STRINGS = {
  documentTitle: `${IconRoute.title} · Stackra Playground`,
  intro:
    "Icon draws an icon by name, at one of three sizes and in a colour role of the theme. The name is a Lucide name, a semantic alias or an app's own namespaced icon, and the registry decides what it draws. It is hidden from screen readers unless it has a label, and it can mirror in right-to-left.",
  sizes: "Sizes",
  sizesNote: "Decorative icons: no label, so assistive technology skips them.",
  tones: "Tones",
  tonesNote:
    "One icon per tone, each labelled with its tone name. With no tone the icon takes the colour of the text around it.",
  inherits: "inherits the text colour",
  names: "Decorative and labelled",
  namesNote:
    "Only the labelled icon is announced; the decorative one sits beside text that already says it.",
  favourites: "Favourites",
  rated: "Rated",
  rtl: "Right to left",
  rtlNote:
    "Switch the language to Arabic: the icons that point the reading way flip, the ones that depict an object do not.",
  mirrored: "Mirrored in right-to-left",
  neverMirrored: "Never mirrored",
  components: "Names, aliases and custom icons",
  componentsNote:
    "An alias resolves to a Lucide icon, and an app's own SVG component is registered under its own namespace: both are drawn through Icon, by name.",
  alias: "orders, an alias of shopping-cart",
  rawElement: "A raw element, as an icon slot of a button takes it",
  passthrough: "Pass-through",
  passthroughNote:
    "Every other SVG prop reaches the icon: a thinner stroke and a class are set here.",
  thinStroke: "strokeWidth 1.5",
  withClass: "className",
  live: "Try it",
  liveNote: "Press the buttons: the icon below changes size or tone.",
  nextSize: "Next size",
  nextTone: "Next tone",
  state: (size: string, tone: string, presses: number) =>
    `Size ${size}, tone ${tone}, pressed ${presses} ${presses === 1 ? "time" : "times"}.`,
} as const;

/** The directional icons that mirror, each labelled so it can be found by its name. */
const MIRRORED: readonly (readonly [string, IconName])[] = [
  ["Next", "chevron-right"],
  ["Continue", "arrow-right"],
  ["Send", "send-horizontal"],
  ["Undo", "undo-2"],
];

/** The icons that depict an object, a check or media, and so are never mirrored. */
const NEVER_MIRRORED: readonly (readonly [string, IconName])[] = [
  ["Search", "search"],
  ["Done", "check"],
  ["Play", "play"],
];

/** An app's own icon: a ring and a dot on Lucide's 24-unit grid, drawn in `currentColor` like a Lucide icon. */
function Mark({ size = 24, strokeWidth = 2 }: IconComponentProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  );
}

/** The page's own custom icon, registered under its namespace so it is drawn by name like any other. */
const PAGE_ICONS = defineIconRegistry({ "playground::mark": Mark });

/** A sample with its caption underneath, the caption isolated left to right. */
function Sample({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <li className="grid justify-items-center gap-2">
      {children}
      <Text type="small" tone="muted">
        <bdi dir="ltr">{caption}</bdi>
      </Text>
    </li>
  );
}

/** The list that lays samples out in a wrapping row. */
const ROW = "flex flex-wrap items-start gap-6";

/** The Icon page. */
export function Icon() {
  const [sizeIndex, setSizeIndex] = useState(1);
  const [toneIndex, setToneIndex] = useState(0);
  const [presses, setPresses] = useState(0);
  const size = Size[sizeIndex % Size.length] ?? "md";
  const tone = TextTone[toneIndex % TextTone.length] ?? "default";

  return (
    <article className="grid gap-10">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <Heading level={1}>{IconRoute.title}</Heading>
        <Text className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </Text>
      </header>

      <PageSection id="icon-sizes" title={STRINGS.sizes} note={STRINGS.sizesNote}>
        <ul className={ROW}>
          {Size.map((each) => (
            <Sample key={each} caption={`${each} · ${ICON_SIZES[each]} px`}>
              <UiIcon name="search" size={each} />
            </Sample>
          ))}
        </ul>
      </PageSection>

      <PageSection id="icon-tones" title={STRINGS.tones} note={STRINGS.tonesNote}>
        <ul className={ROW}>
          {TextTone.map((each) => (
            <Sample key={each} caption={each}>
              <UiIcon name="circle-check" size="lg" tone={each} label={each} />
            </Sample>
          ))}
        </ul>
        <Text tone="muted" className="flex items-center gap-2">
          <UiIcon name="circle-check" />
          <bdi>{STRINGS.inherits}</bdi>
        </Text>
      </PageSection>

      <PageSection id="icon-names" title={STRINGS.names} note={STRINGS.namesNote}>
        <ul className={ROW}>
          <li className="flex items-center gap-2">
            <UiIcon name="heart" />
            <Text>
              <bdi>{STRINGS.favourites}</bdi>
            </Text>
          </li>
          <li className="flex items-center gap-2">
            <UiIcon name="star" label={STRINGS.rated} />
          </li>
        </ul>
      </PageSection>

      <PageSection id="icon-rtl" title={STRINGS.rtl} note={STRINGS.rtlNote}>
        <Heading level={3}>{STRINGS.mirrored}</Heading>
        <ul className={ROW}>
          {MIRRORED.map(([label, name]) => (
            <Sample key={label} caption={name}>
              <UiIcon name={name} size="lg" label={label} isMirroredInRtl />
            </Sample>
          ))}
        </ul>
        <Heading level={3}>{STRINGS.neverMirrored}</Heading>
        <ul className={ROW}>
          {NEVER_MIRRORED.map(([label, name]) => (
            <Sample key={label} caption={name}>
              <UiIcon name={name} size="lg" label={label} />
            </Sample>
          ))}
        </ul>
      </PageSection>

      <PageSection id="icon-components" title={STRINGS.components} note={STRINGS.componentsNote}>
        <IconRegistryProvider registry={PAGE_ICONS}>
          <ul className={ROW}>
            <Sample caption={STRINGS.alias}>
              <UiIcon name="orders" size="lg" />
            </Sample>
            {Size.map((each) => (
              <Sample key={each} caption={`playground::mark · ${each}`}>
                <UiIcon name="playground::mark" size={each} />
              </Sample>
            ))}
            <Sample caption={STRINGS.rawElement}>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </Sample>
          </ul>
        </IconRegistryProvider>
      </PageSection>

      <PageSection id="icon-passthrough" title={STRINGS.passthrough} note={STRINGS.passthroughNote}>
        <ul className={ROW}>
          <Sample caption={STRINGS.thinStroke}>
            <UiIcon name="search" size="lg" strokeWidth={1.5} />
          </Sample>
          <Sample caption={STRINGS.withClass}>
            <UiIcon name="search" size="lg" className="opacity-50" data-testid="passed-class" />
          </Sample>
        </ul>
      </PageSection>

      <PageSection id="icon-live" title={STRINGS.live} note={STRINGS.liveNote}>
        <div className="flex flex-wrap items-center gap-4">
          <Button
            onPress={() => {
              setSizeIndex((index) => index + 1);
              setPresses((count) => count + 1);
            }}
          >
            {STRINGS.nextSize}
          </Button>
          <Button
            onPress={() => {
              setToneIndex((index) => index + 1);
              setPresses((count) => count + 1);
            }}
          >
            {STRINGS.nextTone}
          </Button>
          <UiIcon name="star" size={size} tone={tone} data-testid="live-icon" />
        </div>
        <Text role="status" tone="muted">
          <bdi>{STRINGS.state(size, tone, presses)}</bdi>
        </Text>
      </PageSection>
    </article>
  );
}
