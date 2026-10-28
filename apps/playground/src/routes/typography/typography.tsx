/**
 * Stackra file contract:
 * Purpose: the page of the typography route: every Text type and Heading level and type from @stackra/ui/react, in
 *          every tone, alignment and truncation, and Latin and Arabic text side by side, each labelled with the theme
 *          token it draws, plus a live sample whose tone a button cycles.
 * Boundary: presentation only; token names and values are isolated left to right (`<bdi dir="ltr">`). Strings sit in
 *          one `STRINGS` constant until @stackra/i18n.
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0303 (decisions 6, 7 and 9); ADR 0060 (right-to-left).
 */
import { STACKRA_THEME } from "@stackra/tokens";
import { HeadingType, TextAlign, TextTone, TextType } from "@stackra/ui/contracts";
import { Button, Heading, Text } from "@stackra/ui/react";
import { useState, type ReactNode } from "react";

import { PageSection } from "#src/components/page-section";
import { TypographyRoute } from "#src/routes/typography/typography.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::typography.*` keys.
const STRINGS = {
  documentTitle: `${TypographyRoute.title} · Stackra Playground`,
  intro:
    "Text and Heading draw HeroUI's Typography in the stackra theme's type scale. Each row is labelled with the theme token it draws and its Arabic twin, drawn from a sample marked lang=ar.",
  latinSample: "Build once, theme anywhere.",
  arabicSample: "ابنِ مرة واحدة وطبّق أي سمة.",
  longSample:
    "A long sentence shows what alignment and truncation do when it does not fit on one line.",
  textTypes: "Text types",
  textTypesNote: "Each Text type, in Latin and in Arabic.",
  headingTypes: "Heading types",
  headingTypesNote:
    "Every row is a level-3 heading drawn in another style, so the outline stays flat while every style shows. h4 to h6 are in the theme since ADR 0303.",
  headingLevels: "Heading levels",
  headingLevelsNote: "A nested run of levels, each in the style of its level.",
  level: (level: number) => `Level ${level}`,
  tones: "Tones",
  tonesNote: "Each tone on the page background and on a surface.",
  alignment: "Alignment",
  alignmentNote: "Start and end follow the page direction: switch to Arabic and they swap.",
  truncation: "Truncation",
  truncationNote: "The same sentence wrapped and cut to one line, and a heading cut to one line.",
  weight: "Weight",
  weightNote: "HeroUI's weight passes through; the theme restates the modifiers after its types.",
  language: "Language",
  languageNote:
    "Text marked with its own language takes that language's style, whatever the page direction.",
  inline: "Inline",
  inlineNote: "A Text drawn as a span inside a sentence, and small muted text.",
  inlineBefore: "A sentence with ",
  inlineText: "inline text",
  inlineAfter: " drawn through render.",
  small: "Small and muted: the secondary line of a list.",
  live: "Try it",
  liveNote: "Press the button to move to the next tone.",
  nextTone: "Next tone",
  state: (tone: string, presses: number) =>
    `Tone ${tone}, pressed ${presses} ${presses === 1 ? "time" : "times"}.`,
} as const;

/** The text tokens of the stackra theme, for the row labels. */
const TOKENS = STACKRA_THEME.typography;

/** The size and line height of a theme token, `40px/1.1`, or an empty string for a token the theme lacks. */
const metrics = (name: string) => {
  const style = TOKENS[name];
  return style ? `${style.size}/${style.lineHeight}` : "";
};

/** A row label: the token, its values, and its Arabic twin's values, isolated left to right. */
function TokenLabel({ prefix, token }: { prefix?: string; token: string }) {
  return (
    <Text type="caption" tone="muted">
      <bdi dir="ltr">
        {prefix ? `${prefix} · ` : ""}
        <code>{token}</code> · {metrics(token)} · {`ar ${metrics(`${token}-ar`)}`}
      </bdi>
    </Text>
  );
}

/** A list item of the type rows: label above, Latin and Arabic samples beside each other. */
function TypeRow({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <li className="grid gap-1 border-b border-separator pb-3">
      {label}
      <div className="grid gap-x-8 gap-y-2 md:grid-cols-2">{children}</div>
    </li>
  );
}

/** The Typography page. */
export function Typography() {
  const [toneIndex, setToneIndex] = useState(0);
  const [presses, setPresses] = useState(0);
  const tone = TextTone[toneIndex % TextTone.length] ?? "default";

  return (
    <article className="grid gap-10">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <Heading level={1}>{TypographyRoute.title}</Heading>
        <Text className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </Text>
      </header>

      <PageSection id="typography-text" title={STRINGS.textTypes} note={STRINGS.textTypesNote}>
        <ul className="grid gap-3">
          {TextType.map((type) => (
            <TypeRow key={type} label={<TokenLabel token={type} />}>
              <Text type={type} data-testid={`text-${type}`}>
                {STRINGS.latinSample}
              </Text>
              <Text type={type} lang="ar" data-testid={`text-${type}-ar`}>
                {STRINGS.arabicSample}
              </Text>
            </TypeRow>
          ))}
        </ul>
      </PageSection>

      <PageSection
        id="typography-heading-types"
        title={STRINGS.headingTypes}
        note={STRINGS.headingTypesNote}
      >
        <ul className="grid gap-3">
          {HeadingType.map((type) => (
            <TypeRow key={type} label={<TokenLabel prefix={`level 3, type`} token={type} />}>
              <Heading level={3} type={type} data-testid={`heading-${type}`}>
                {STRINGS.latinSample}
              </Heading>
              <Heading level={3} type={type} lang="ar" data-testid={`heading-${type}-ar`}>
                {STRINGS.arabicSample}
              </Heading>
            </TypeRow>
          ))}
        </ul>
      </PageSection>

      <PageSection
        id="typography-heading-levels"
        title={STRINGS.headingLevels}
        note={STRINGS.headingLevelsNote}
      >
        <Heading level={3} data-testid="level-3">
          {STRINGS.level(3)}
        </Heading>
        <Heading level={4} data-testid="level-4">
          {STRINGS.level(4)}
        </Heading>
        <Heading level={5} data-testid="level-5">
          {STRINGS.level(5)}
        </Heading>
        <Heading level={6} data-testid="level-6">
          {STRINGS.level(6)}
        </Heading>
      </PageSection>

      <PageSection id="typography-tones" title={STRINGS.tones} note={STRINGS.tonesNote}>
        <ul className="grid gap-3 md:grid-cols-2">
          {TextTone.map((each) => (
            <li key={each} className="grid gap-2">
              <Text tone={each} data-testid={`tone-${each}`}>
                <bdi>{`${each}: ${STRINGS.latinSample}`}</bdi>
              </Text>
              <div className="rounded-lg bg-surface p-3">
                <Text tone={each} data-testid={`tone-${each}-surface`}>
                  <bdi>{`${each}: ${STRINGS.latinSample}`}</bdi>
                </Text>
              </div>
            </li>
          ))}
        </ul>
      </PageSection>

      <PageSection id="typography-alignment" title={STRINGS.alignment} note={STRINGS.alignmentNote}>
        <ul className="grid gap-3">
          {TextAlign.map((align) => (
            <li key={align} className="grid gap-1 rounded-lg border border-border p-3">
              <Text type="caption" tone="muted">
                <bdi dir="ltr">{align}</bdi>
              </Text>
              <Text align={align} data-testid={`align-${align}`}>
                <bdi>{STRINGS.longSample}</bdi>
              </Text>
            </li>
          ))}
        </ul>
      </PageSection>

      <PageSection
        id="typography-truncation"
        title={STRINGS.truncation}
        note={STRINGS.truncationNote}
      >
        <div className="grid max-w-48 gap-3 rounded-lg border border-border p-3">
          <Text data-testid="wrapped">
            <bdi>{STRINGS.longSample}</bdi>
          </Text>
          <Text isTruncated data-testid="truncated">
            <bdi>{STRINGS.longSample}</bdi>
          </Text>
          <Heading level={3} type="h4" isTruncated data-testid="truncated-heading">
            <bdi>{STRINGS.longSample}</bdi>
          </Heading>
        </div>
      </PageSection>

      <PageSection id="typography-weight" title={STRINGS.weight} note={STRINGS.weightNote}>
        <Text weight="bold" data-testid="weight-bold">
          <bdi>{STRINGS.latinSample}</bdi>
        </Text>
      </PageSection>

      <PageSection id="typography-language" title={STRINGS.language} note={STRINGS.languageNote}>
        <Text lang="ar" data-testid="lang-ar">
          {STRINGS.arabicSample}
        </Text>
        <Text lang="en" data-testid="lang-en">
          <bdi>{STRINGS.latinSample}</bdi>
        </Text>
      </PageSection>

      <PageSection id="typography-inline" title={STRINGS.inline} note={STRINGS.inlineNote}>
        <p>
          <bdi>
            {STRINGS.inlineBefore}
            <Text tone="accent" weight="semibold" render={(props) => <span {...props} />}>
              {STRINGS.inlineText}
            </Text>
            {STRINGS.inlineAfter}
          </bdi>
        </p>
        <Text type="small" tone="muted">
          <bdi>{STRINGS.small}</bdi>
        </Text>
      </PageSection>

      <PageSection id="typography-live" title={STRINGS.live} note={STRINGS.liveNote}>
        <div className="flex flex-wrap items-center gap-4">
          <Button
            onPress={() => {
              setToneIndex((index) => index + 1);
              setPresses((count) => count + 1);
            }}
          >
            {STRINGS.nextTone}
          </Button>
          <Text tone={tone} data-testid="live-text">
            <bdi>{STRINGS.latinSample}</bdi>
          </Text>
        </div>
        <Text role="status" type="small" tone="muted">
          <bdi>{STRINGS.state(tone, presses)}</bdi>
        </Text>
      </PageSection>
    </article>
  );
}
