/**
 * Stackra file contract:
 * Purpose: the page of the text-field route: both variants, a field with each part (label, description, error,
 *          placeholder), every state (required, invalid, disabled, read-only), every kind of text, full width and content
 *          width, and a live email field that checks what is typed and echoes it, all from `@stackra/ui/react` with real
 *          props.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n.
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0303 (decision 7); ADR 0060 (light, dark, RTL).
 */
import { TextFieldType } from "@stackra/ui/contracts";
import * as Ui from "@stackra/ui/react";
import { useState } from "react";

import { PageSection } from "#src/components/page-section";
import { TextFieldRoute } from "#src/routes/text-field/text-field.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::text-field.*` keys.
const STRINGS = {
  documentTitle: `${TextFieldRoute.title} · Stackra Playground`,
  intro:
    "A text field is a single-line input with its label, an optional description and an error message in one component. The label names the input; the error shows only while the field is invalid, and replaces the description.",
  variants: "Variants",
  variantsNote:
    "Primary sits on the page; secondary is for a surface that is already tinted, so it is shown on one.",
  primary: "Primary field",
  secondary: "Secondary field",
  parts: "Parts",
  partsNote: "Each part appears only when it is given.",
  labelOnly: "Label only",
  withPlaceholder: "With a placeholder",
  placeholder: "Ada Lovelace",
  withDescription: "With a description",
  description: "As it appears on your invoices.",
  states: "States",
  statesNote:
    "Required adds the asterisk, invalid shows the error, disabled and read-only keep the value.",
  required: "Required field",
  invalid: "Invalid field",
  invalidMessage: "Enter a name of at least two letters.",
  disabled: "Disabled field",
  readOnly: "Read-only field",
  kept: "Kept value",
  kinds: "Kinds of text",
  kindsNote:
    "The kind sets the input type on web and the keyboard, masking and capitalisation on native.",
  kindLabel: (kind: string) => `Kind: ${kind}`,
  width: "Width",
  widthNote:
    "Full width fills its parent, which is the default; turn it off to size to the content.",
  full: "Full width",
  content: "Content width",
  live: "Try it",
  liveNote:
    "An email field that is invalid until it has an at sign, with the text typed so far shown beneath it.",
  liveLabel: "Work email",
  liveDescription: "We use it to send the invoice.",
  liveError: "Enter an email address with an at sign.",
  liveEmpty: "Nothing typed yet.",
  liveTyped: (text: string) => `You typed ${text.length} characters: ${text}`,
} as const;

/** The grid that lays fields out in columns that wrap. */
const GRID = "grid gap-4 sm:grid-cols-2";

/** The TextField page. */
export function TextField() {
  const [email, setEmail] = useState("");
  const isInvalid = email.length > 0 && !email.includes("@");

  return (
    <article className="grid gap-10">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <Ui.Heading level={1}>{TextFieldRoute.title}</Ui.Heading>
        <Ui.Text className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </Ui.Text>
      </header>

      <PageSection id="text-field-variants" title={STRINGS.variants} note={STRINGS.variantsNote}>
        <div className={GRID}>
          <Ui.TextField label={STRINGS.primary} variant="primary" defaultValue="Ada" />
          <Ui.Surface variant="secondary" className="rounded-lg p-4">
            <Ui.TextField label={STRINGS.secondary} variant="secondary" defaultValue="Ada" />
          </Ui.Surface>
        </div>
      </PageSection>

      <PageSection id="text-field-parts" title={STRINGS.parts} note={STRINGS.partsNote}>
        <div className={GRID}>
          <Ui.TextField label={STRINGS.labelOnly} />
          <Ui.TextField label={STRINGS.withPlaceholder} placeholder={STRINGS.placeholder} />
          <Ui.TextField label={STRINGS.withDescription} description={STRINGS.description} />
        </div>
      </PageSection>

      <PageSection id="text-field-states" title={STRINGS.states} note={STRINGS.statesNote}>
        <div className={GRID}>
          <Ui.TextField label={STRINGS.required} isRequired />
          <Ui.TextField
            label={STRINGS.invalid}
            isInvalid
            defaultValue="A"
            errorMessage={STRINGS.invalidMessage}
          />
          <Ui.TextField label={STRINGS.disabled} isDisabled defaultValue={STRINGS.kept} />
          <Ui.TextField label={STRINGS.readOnly} isReadOnly defaultValue={STRINGS.kept} />
        </div>
      </PageSection>

      <PageSection id="text-field-kinds" title={STRINGS.kinds} note={STRINGS.kindsNote}>
        <div className={GRID}>
          {TextFieldType.map((kind) => (
            <Ui.TextField key={kind} label={STRINGS.kindLabel(kind)} type={kind} />
          ))}
        </div>
      </PageSection>

      <PageSection id="text-field-width" title={STRINGS.width} note={STRINGS.widthNote}>
        <div className="grid gap-4">
          <Ui.TextField label={STRINGS.full} />
          <Ui.TextField label={STRINGS.content} isFullWidth={false} />
        </div>
      </PageSection>

      <PageSection id="text-field-live" title={STRINGS.live} note={STRINGS.liveNote}>
        <Ui.TextField
          label={STRINGS.liveLabel}
          description={STRINGS.liveDescription}
          errorMessage={STRINGS.liveError}
          type="email"
          isInvalid={isInvalid}
          value={email}
          onChange={setEmail}
        />
        <Ui.Text data-testid="typed" aria-live="polite">
          {email === "" ? STRINGS.liveEmpty : STRINGS.liveTyped(email)}
        </Ui.Text>
      </PageSection>
    </article>
  );
}
