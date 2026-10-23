/**
 * Stackra file contract:
 * Purpose: the page of the chip route: every variant by every tone in every size, start, end and both icons, a
 *          direction-aware chevron, chips inside running text and in a list, and a live sample that steps through
 *          variants and tones, all from `@stackra/ui/react` with real props.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n. Icons come from `lucide-react`
 *          through `Ui.Icon`.
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0303 (decisions 3 and 7); ADR 0304; ADR 0060 (light, dark,
 *          RTL).
 */
import { ChipVariant, Size, Tone } from "@stackra/ui/contracts";
import * as Ui from "@stackra/ui/react";
import { Check, ChevronRight } from "lucide-react";
import { createElement, useState } from "react";

import { PageSection } from "#src/components/page-section";
import { ChipRoute } from "#src/routes/chip/chip.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::chip.*` keys.
const STRINGS = {
  documentTitle: `${ChipRoute.title} · Stackra Playground`,
  intro:
    "A Chip is a compact, non-interactive label: a variant, a tone, a size and optional icons. It is display only. For tags that can be selected or removed use a tag group, and for an action a button.",
  matrix: "Variants and tones",
  matrixNote:
    "One table per size: a row per variant, a column per tone, each chip labelled with its tone.",
  size: (size: string) => `Size ${size}`,
  variantColumn: "Variant",
  icons: "Icons",
  iconsNote:
    "A start icon, an end icon that mirrors in right-to-left, and both. Icons are the size of the text.",
  start: "Verified",
  end: "Next",
  both: "Approved",
  context: "In context",
  contextNote: "A chip inside a sentence, and a list of category chips drawn as list items.",
  sentencePrefix: "This order is",
  sentenceSuffix: "and ships tomorrow.",
  sentenceChip: "On track",
  categories: "Categories",
  live: "Try it",
  liveNote: "Step through the variants and the tones; the chip shows what it is.",
  nextVariant: "Next variant",
  nextTone: "Next tone",
  current: (variant: string, tone: string) => `${variant}, ${tone}`,
  currentLabel: "Chip",
} as const;

/** The category chips of the list sample. */
const CATEGORIES = ["Billing", "Shipping", "Returns", "Support"] as const;

/** The list that lays samples out in a wrapping row. */
const ROW = "flex flex-wrap items-center gap-3";

/** The Chip page. */
export function Chip() {
  const [variantIndex, setVariantIndex] = useState(0);
  const [toneIndex, setToneIndex] = useState(0);
  const variant = ChipVariant[variantIndex] ?? "secondary";
  const tone = Tone[toneIndex] ?? "default";

  return (
    <article className="grid gap-10">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <Ui.Heading level={1}>{ChipRoute.title}</Ui.Heading>
        <Ui.Text className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </Ui.Text>
      </header>

      <PageSection id="chip-matrix" title={STRINGS.matrix} note={STRINGS.matrixNote}>
        {Size.map((size) => (
          <div key={size} className="grid gap-2">
            <Ui.Heading level={3}>{STRINGS.size(size)}</Ui.Heading>
            <table className="w-full text-start">
              <thead>
                <tr>
                  <th scope="col" className="p-2 text-start text-sm font-semibold">
                    {STRINGS.variantColumn}
                  </th>
                  {Tone.map((name) => (
                    <th key={name} scope="col" className="p-2 text-start text-sm font-semibold">
                      {name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ChipVariant.map((name) => (
                  <tr key={name}>
                    <th scope="row" className="p-2 text-start text-sm font-semibold">
                      {name}
                    </th>
                    {Tone.map((toneName) => (
                      <td key={toneName} className="p-2">
                        <Ui.Chip variant={name} tone={toneName} size={size}>
                          {toneName}
                        </Ui.Chip>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </PageSection>

      <PageSection id="chip-icons" title={STRINGS.icons} note={STRINGS.iconsNote}>
        <ul className={ROW}>
          <li>
            <Ui.Chip tone="success" startIcon={<Ui.Icon as={Check} />}>
              {STRINGS.start}
            </Ui.Chip>
          </li>
          <li>
            <Ui.Chip endIcon={<Ui.Icon as={ChevronRight} isMirroredInRtl />}>{STRINGS.end}</Ui.Chip>
          </li>
          <li>
            <Ui.Chip
              variant="soft"
              tone="accent"
              size="lg"
              startIcon={<Ui.Icon as={Check} />}
              endIcon={<Ui.Icon as={ChevronRight} isMirroredInRtl />}
            >
              {STRINGS.both}
            </Ui.Chip>
          </li>
        </ul>
      </PageSection>

      <PageSection id="chip-context" title={STRINGS.context} note={STRINGS.contextNote}>
        <Ui.Text className="max-w-prose">
          <bdi>
            {STRINGS.sentencePrefix}{" "}
            <Ui.Chip tone="success" size="sm">
              {STRINGS.sentenceChip}
            </Ui.Chip>{" "}
            {STRINGS.sentenceSuffix}
          </bdi>
        </Ui.Text>
        <ul aria-label={STRINGS.categories} className={ROW}>
          {CATEGORIES.map((name) => (
            <Ui.Chip
              key={name}
              variant="tertiary"
              // `render` is typed for a span's ref; a plain object type lets a list item take the props.
              render={(props: object) => createElement("li", props)}
            >
              {name}
            </Ui.Chip>
          ))}
        </ul>
      </PageSection>

      <PageSection id="chip-live" title={STRINGS.live} note={STRINGS.liveNote}>
        <div className={ROW}>
          <Ui.Button
            variant="secondary"
            onPress={() => setVariantIndex((index) => (index + 1) % ChipVariant.length)}
          >
            {STRINGS.nextVariant}
          </Ui.Button>
          <Ui.Button
            variant="secondary"
            onPress={() => setToneIndex((index) => (index + 1) % Tone.length)}
          >
            {STRINGS.nextTone}
          </Ui.Button>
        </div>
        <div className={ROW}>
          <Ui.Chip variant={variant} tone={tone} startIcon={<Ui.Icon as={Check} />}>
            {STRINGS.current(variant, tone)}
          </Ui.Chip>
        </div>
      </PageSection>
    </article>
  );
}
