/**
 * Stackra file contract:
 * Purpose: the page of the text-area route: both variants, a field with each part (label, description, error,
 *          placeholder), the number of lines, every state (required, invalid, disabled, read-only), full width and
 *          content width, and a live message field with a character count that turns invalid past its limit, all from
 *          `@stackra/ui/react` with real props.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n.
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0303 (decision 7); ADR 0060 (light, dark, RTL).
 */
import { Heading, Surface, Text, TextArea as UiTextArea } from "@stackra/ui/react";
import { useState } from "react";

import { PageSection } from "#src/components/page-section";
import { TextAreaRoute } from "#src/routes/text-area/text-area.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::text-area.*` keys.
const STRINGS = {
  documentTitle: `${TextAreaRoute.title} · Stackra Playground`,
  intro:
    "A text area is a multi-line input with its label, an optional description and an error message in one component. It takes the same field props as a text field, plus the number of lines it shows.",
  variants: "Variants",
  variantsNote:
    "Primary sits on the page; secondary is for a surface that is already tinted, so it is shown on one.",
  primary: "Primary area",
  secondary: "Secondary area",
  parts: "Parts",
  partsNote: "Each part appears only when it is given.",
  labelOnly: "Label only",
  withPlaceholder: "With a placeholder",
  placeholder: "Tell us what happened",
  withDescription: "With a description",
  description: "Include the order number if you have one.",
  lines: "Lines",
  linesNote: "Two lines and six lines; the area scrolls once the text is longer.",
  twoLines: "Two lines",
  sixLines: "Six lines",
  states: "States",
  statesNote:
    "Required adds the asterisk, invalid shows the error, disabled and read-only keep the value.",
  required: "Required area",
  invalid: "Invalid area",
  invalidMessage: "Write at least ten characters.",
  disabled: "Disabled area",
  readOnly: "Read-only area",
  kept: "Kept value",
  width: "Width",
  widthNote:
    "Full width fills its parent, which is the default; turn it off to size to the content.",
  full: "Full width area",
  content: "Content width area",
  live: "Try it",
  liveNote:
    "A message of at most 40 characters: the count follows the text and the area turns invalid past it.",
  liveLabel: "Message",
  liveDescription: "Keep it short.",
  liveError: "The message is over 40 characters.",
  liveCount: (count: number) => `${count} of 40 characters`,
} as const;

/** The longest message the live sample accepts. */
const LIMIT = 40;

/** The grid that lays fields out in columns that wrap. */
const GRID = "grid gap-4 sm:grid-cols-2";

/** The TextArea page. */
export function TextArea() {
  const [message, setMessage] = useState("");

  return (
    <article className="grid gap-10">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <Heading level={1}>{TextAreaRoute.title}</Heading>
        <Text className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </Text>
      </header>

      <PageSection id="text-area-variants" title={STRINGS.variants} note={STRINGS.variantsNote}>
        <div className={GRID}>
          <UiTextArea label={STRINGS.primary} variant="primary" defaultValue="Ada" />
          <Surface variant="secondary" className="rounded-lg p-4">
            <UiTextArea label={STRINGS.secondary} variant="secondary" defaultValue="Ada" />
          </Surface>
        </div>
      </PageSection>

      <PageSection id="text-area-parts" title={STRINGS.parts} note={STRINGS.partsNote}>
        <div className={GRID}>
          <UiTextArea label={STRINGS.labelOnly} />
          <UiTextArea label={STRINGS.withPlaceholder} placeholder={STRINGS.placeholder} />
          <UiTextArea label={STRINGS.withDescription} description={STRINGS.description} />
        </div>
      </PageSection>

      <PageSection id="text-area-lines" title={STRINGS.lines} note={STRINGS.linesNote}>
        <div className={GRID}>
          <UiTextArea label={STRINGS.twoLines} rows={2} />
          <UiTextArea label={STRINGS.sixLines} rows={6} />
        </div>
      </PageSection>

      <PageSection id="text-area-states" title={STRINGS.states} note={STRINGS.statesNote}>
        <div className={GRID}>
          <UiTextArea label={STRINGS.required} isRequired />
          <UiTextArea
            label={STRINGS.invalid}
            isInvalid
            defaultValue="Hi"
            errorMessage={STRINGS.invalidMessage}
          />
          <UiTextArea label={STRINGS.disabled} isDisabled defaultValue={STRINGS.kept} />
          <UiTextArea label={STRINGS.readOnly} isReadOnly defaultValue={STRINGS.kept} />
        </div>
      </PageSection>

      <PageSection id="text-area-width" title={STRINGS.width} note={STRINGS.widthNote}>
        <div className="grid gap-4">
          <UiTextArea label={STRINGS.full} />
          <UiTextArea label={STRINGS.content} isFullWidth={false} />
        </div>
      </PageSection>

      <PageSection id="text-area-live" title={STRINGS.live} note={STRINGS.liveNote}>
        <UiTextArea
          label={STRINGS.liveLabel}
          description={STRINGS.liveDescription}
          errorMessage={STRINGS.liveError}
          rows={3}
          isInvalid={message.length > LIMIT}
          value={message}
          onChange={setMessage}
        />
        <Text data-testid="count" aria-live="polite">
          {STRINGS.liveCount(message.length)}
        </Text>
      </PageSection>
    </article>
  );
}
