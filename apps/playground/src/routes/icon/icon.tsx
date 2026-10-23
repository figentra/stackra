/**
 * Stackra file contract:
 * Purpose: the page of the icon route: every Icon size, tone, decorative and labelled use, the directional icons that
 *          mirror in right-to-left beside ones that never do, an app's own SVG component drawn through Icon, the SVG
 *          props that pass through, and a live sample whose size and tone a button cycles.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n. Icons come from `lucide-react`
 *          directly, because @stackra/ui does not re-export Lucide in wave 1 (ADR 0303 decision 3).
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0303 (decisions 3 and 7); ADR 0060 (right-to-left).
 */
import { ICON_SIZES } from "@stackra/ui";
import { Size, TextTone, type IconComponentProps } from "@stackra/ui/contracts";
import * as Ui from "@stackra/ui/react";
import {
  ArrowRight,
  ChevronRight,
  Check,
  CircleCheck,
  Heart,
  Play,
  Plus,
  Search,
  SendHorizontal,
  Star,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { PageSection } from "#src/components/page-section";
import { IconRoute } from "#src/routes/icon/icon.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::icon.*` keys.
const STRINGS = {
  documentTitle: `${IconRoute.title} · Stackra Playground`,
  intro:
    "Icon draws a Lucide icon, or any component with the same props, at one of three sizes and in a colour role of the theme. It is hidden from screen readers unless it has a label, and it can mirror in right-to-left.",
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
  components: "Any icon component",
  componentsNote:
    "An app's own SVG component with the same props is drawn through Icon, at all three sizes.",
  rawElement: "A raw Lucide element, as an icon slot of a button takes it",
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
const MIRRORED: readonly (readonly [string, LucideIcon, string])[] = [
  ["Next", ChevronRight, "ChevronRight"],
  ["Continue", ArrowRight, "ArrowRight"],
  ["Send", SendHorizontal, "SendHorizontal"],
  ["Undo", Undo2, "Undo2"],
];

/** The icons that depict an object, a check or media, and so are never mirrored. */
const NEVER_MIRRORED: readonly (readonly [string, LucideIcon, string])[] = [
  ["Search", Search, "Search"],
  ["Done", Check, "Check"],
  ["Play", Play, "Play"],
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

/** A sample with its caption underneath, the caption isolated left to right. */
function Sample({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <li className="grid justify-items-center gap-2">
      {children}
      <Ui.Text type="small" tone="muted">
        <bdi dir="ltr">{caption}</bdi>
      </Ui.Text>
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
        <Ui.Heading level={1}>{IconRoute.title}</Ui.Heading>
        <Ui.Text className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </Ui.Text>
      </header>

      <PageSection id="icon-sizes" title={STRINGS.sizes} note={STRINGS.sizesNote}>
        <ul className={ROW}>
          {Size.map((each) => (
            <Sample key={each} caption={`${each} · ${ICON_SIZES[each]} px`}>
              <Ui.Icon as={Search} size={each} />
            </Sample>
          ))}
        </ul>
      </PageSection>

      <PageSection id="icon-tones" title={STRINGS.tones} note={STRINGS.tonesNote}>
        <ul className={ROW}>
          {TextTone.map((each) => (
            <Sample key={each} caption={each}>
              <Ui.Icon as={CircleCheck} size="lg" tone={each} label={each} />
            </Sample>
          ))}
        </ul>
        <Ui.Text tone="muted" className="flex items-center gap-2">
          <Ui.Icon as={CircleCheck} />
          <bdi>{STRINGS.inherits}</bdi>
        </Ui.Text>
      </PageSection>

      <PageSection id="icon-names" title={STRINGS.names} note={STRINGS.namesNote}>
        <ul className={ROW}>
          <li className="flex items-center gap-2">
            <Ui.Icon as={Heart} />
            <Ui.Text>
              <bdi>{STRINGS.favourites}</bdi>
            </Ui.Text>
          </li>
          <li className="flex items-center gap-2">
            <Ui.Icon as={Star} label={STRINGS.rated} />
          </li>
        </ul>
      </PageSection>

      <PageSection id="icon-rtl" title={STRINGS.rtl} note={STRINGS.rtlNote}>
        <Ui.Heading level={3}>{STRINGS.mirrored}</Ui.Heading>
        <ul className={ROW}>
          {MIRRORED.map(([name, component, caption]) => (
            <Sample key={name} caption={caption}>
              <Ui.Icon as={component} size="lg" label={name} isMirroredInRtl />
            </Sample>
          ))}
        </ul>
        <Ui.Heading level={3}>{STRINGS.neverMirrored}</Ui.Heading>
        <ul className={ROW}>
          {NEVER_MIRRORED.map(([name, component, caption]) => (
            <Sample key={name} caption={caption}>
              <Ui.Icon as={component} size="lg" label={name} />
            </Sample>
          ))}
        </ul>
      </PageSection>

      <PageSection id="icon-components" title={STRINGS.components} note={STRINGS.componentsNote}>
        <ul className={ROW}>
          {Size.map((each) => (
            <Sample key={each} caption={`Mark · ${each}`}>
              <Ui.Icon as={Mark} size={each} />
            </Sample>
          ))}
          <Sample caption={STRINGS.rawElement}>
            <Plus aria-hidden="true" />
          </Sample>
        </ul>
      </PageSection>

      <PageSection id="icon-passthrough" title={STRINGS.passthrough} note={STRINGS.passthroughNote}>
        <ul className={ROW}>
          <Sample caption={STRINGS.thinStroke}>
            <Ui.Icon as={Search} size="lg" strokeWidth={1.5} />
          </Sample>
          <Sample caption={STRINGS.withClass}>
            <Ui.Icon as={Search} size="lg" className="opacity-50" data-testid="passed-class" />
          </Sample>
        </ul>
      </PageSection>

      <PageSection id="icon-live" title={STRINGS.live} note={STRINGS.liveNote}>
        <div className="flex flex-wrap items-center gap-4">
          <Ui.Button
            onPress={() => {
              setSizeIndex((index) => index + 1);
              setPresses((count) => count + 1);
            }}
          >
            {STRINGS.nextSize}
          </Ui.Button>
          <Ui.Button
            onPress={() => {
              setToneIndex((index) => index + 1);
              setPresses((count) => count + 1);
            }}
          >
            {STRINGS.nextTone}
          </Ui.Button>
          <Ui.Icon as={Star} size={size} tone={tone} data-testid="live-icon" />
        </div>
        <Ui.Text role="status" tone="muted">
          <bdi>{STRINGS.state(size, tone, presses)}</bdi>
        </Ui.Text>
      </PageSection>
    </article>
  );
}
