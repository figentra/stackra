/**
 * Stackra file contract:
 * Purpose: the page of the form route: the Label in each state, a Description tied to its field, a FieldError shown and
 *          hidden by `isInvalid`, and one live Form with a text box, a text area and a submit button, whose switch turns
 *          on submitting by Cmd or Ctrl plus Enter, all from `@stackra/ui/react` with real props.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n. The text controls are plain `input`
 *          and `textarea` elements dressed with HeroUI's own `input` class, on purpose: the parts' wiring (`htmlFor`,
 *          `aria-describedby`, `id`) is the page's own and shows how a plain control is tied to them, while the switch
 *          is the design system's own. Every disabled label sits beside a disabled control, as the rule for a disabled name requires.
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0303 (decision 7); ADR 0055 (forms); ADR 0060 (light, dark,
 *          RTL); WCAG 2.2 SC 1.3.1, 3.3.1 and 3.3.3.
 */
import {
  Button,
  Description,
  FieldError,
  Form as UiForm,
  Heading,
  Label,
  Switch,
  Text,
} from "@stackra/ui/react";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";

import { PageSection } from "#src/components/page-section";
import { FormRoute } from "#src/routes/form/form.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::form.*` keys.
const STRINGS = {
  documentTitle: `${FormRoute.title} · Stackra Playground`,
  intro:
    "The form and its parts. A Label names a field, a Description tells the user what to enter, a FieldError says what is wrong, and a Form holds the fields and submits them together. Beside a plain control each part is tied to it with an id; inside a field the field ties them.",
  label: "Label",
  labelNote: "Each state beside the control it names. The asterisk marks a required field.",
  labelDefault: "Default label",
  labelRequired: "Required label",
  labelInvalid: "Invalid label",
  labelDisabled: "Disabled label",
  description: "Description",
  descriptionNote:
    "Help text under a field. The control names it in aria-describedby, so it is read out with the field.",
  displayName: "Display name",
  displayNameHint: "Shown on invoices. You can change it later.",
  fieldError: "Field error",
  fieldErrorNote:
    "The message under an invalid field, shown while isInvalid is true. A valid field shows nothing.",
  invalidField: "Invalid field",
  invalidMessage: "Enter a value before you continue.",
  validField: "Valid field",
  validNote: "The error is mounted with isInvalid false: nothing is drawn.",
  live: "Try it",
  liveNote:
    "A form that checks the email when you submit. With the switch on, Enter in a text box does not submit; Cmd or Ctrl plus Enter does.",
  formName: "Contact",
  email: "Email",
  emailHint: "We reply to this address.",
  emailError: "Enter an email address, such as name@example.com.",
  notes: "Notes",
  notesHint: "Optional. Enter adds a line.",
  submit: "Send",
  modEnter: "Submit with Cmd or Ctrl plus Enter",
  notSent: "Nothing sent yet.",
  refused: "Not sent: the email is not valid.",
  sent: (count: number, email: string) =>
    `Sent ${count} time${count === 1 ? "" : "s"}, to ${email}.`,
} as const;

/** HeroUI's own field look, for the plain controls: border, background, focus ring, invalid and disabled states. */
const CONTROL = "input w-full";

/** One address, loosely: something, an at sign, something, a dot, something. The page's check, not a standard. */
const EMAIL = /^\S+@\S+\.\S+$/;

/** The four states of the label, each beside a control that shows the same state. */
const LABEL_SAMPLES = [
  { id: "label-default", text: STRINGS.labelDefault },
  { id: "label-required", text: STRINGS.labelRequired, isRequired: true },
  { id: "label-invalid", text: STRINGS.labelInvalid, isInvalid: true },
  { id: "label-disabled", text: STRINGS.labelDisabled, isDisabled: true },
] as const;

/** A label with its plain control, in one of the four states. */
function LabelSample({ sample }: { sample: (typeof LABEL_SAMPLES)[number] }) {
  const isRequired = "isRequired" in sample;
  const isInvalid = "isInvalid" in sample;
  const isDisabled = "isDisabled" in sample;
  return (
    <div className="grid gap-1">
      <Label
        htmlFor={sample.id}
        isRequired={isRequired}
        isInvalid={isInvalid}
        isDisabled={isDisabled}
      >
        {sample.text}
      </Label>
      <input
        id={sample.id}
        className={CONTROL}
        required={isRequired}
        disabled={isDisabled}
        aria-invalid={isInvalid || undefined}
        data-invalid={isInvalid || undefined}
      />
    </div>
  );
}

/** The Form page. */
export function Form() {
  const [isModEnter, setIsModEnter] = useState(true);
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [isEmailInvalid, setIsEmailInvalid] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [status, setStatus] = useState<string>(STRINGS.notSent);
  const emailRef = useRef<HTMLInputElement>(null);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const isValid = EMAIL.test(email);
    setIsEmailInvalid(!isValid);
    if (!isValid) {
      setStatus(STRINGS.refused);
      // Moving focus to the first invalid field tells a keyboard or screen-reader user where the problem is.
      emailRef.current?.focus();
      return;
    }
    setSentCount(sentCount + 1);
    setStatus(STRINGS.sent(sentCount + 1, email));
  };

  return (
    <article className="grid gap-10">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <Heading level={1}>{FormRoute.title}</Heading>
        <Text className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </Text>
      </header>

      <PageSection id="form-label" title={STRINGS.label} note={STRINGS.labelNote}>
        <div className="grid max-w-sm gap-4">
          {LABEL_SAMPLES.map((sample) => (
            <LabelSample key={sample.id} sample={sample} />
          ))}
        </div>
      </PageSection>

      <PageSection id="form-description" title={STRINGS.description} note={STRINGS.descriptionNote}>
        <div className="grid max-w-sm gap-1">
          <Label htmlFor="display-name">{STRINGS.displayName}</Label>
          <input id="display-name" className={CONTROL} aria-describedby="display-name-hint" />
          <Description id="display-name-hint">{STRINGS.displayNameHint}</Description>
        </div>
      </PageSection>

      <PageSection id="form-field-error" title={STRINGS.fieldError} note={STRINGS.fieldErrorNote}>
        <div className="grid max-w-sm gap-4">
          <div className="grid gap-1">
            <Label htmlFor="invalid-field" isInvalid>
              {STRINGS.invalidField}
            </Label>
            <input
              id="invalid-field"
              className={CONTROL}
              aria-invalid
              data-invalid
              aria-describedby="invalid-field-error"
            />
            <FieldError id="invalid-field-error" isInvalid>
              {STRINGS.invalidMessage}
            </FieldError>
          </div>
          <div className="grid gap-1">
            <Label htmlFor="valid-field">{STRINGS.validField}</Label>
            <input id="valid-field" className={CONTROL} aria-describedby="valid-field-hint" />
            <Description id="valid-field-hint">{STRINGS.validNote}</Description>
            <FieldError id="valid-field-error" isInvalid={false}>
              {STRINGS.invalidMessage}
            </FieldError>
          </div>
        </div>
      </PageSection>

      <PageSection id="form-live" title={STRINGS.live} note={STRINGS.liveNote}>
        <UiForm
          aria-label={STRINGS.formName}
          validationBehavior="aria"
          isSubmitOnModEnter={isModEnter}
          onSubmit={onSubmit}
          className="grid max-w-sm gap-4"
        >
          <div className="grid gap-1">
            <Label htmlFor="email" isRequired isInvalid={isEmailInvalid}>
              {STRINGS.email}
            </Label>
            <input
              id="email"
              ref={emailRef}
              type="text"
              inputMode="email"
              autoComplete="email"
              className={CONTROL}
              required
              value={email}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)}
              aria-invalid={isEmailInvalid || undefined}
              data-invalid={isEmailInvalid || undefined}
              aria-describedby={isEmailInvalid ? "email-hint email-error" : "email-hint"}
            />
            <Description id="email-hint">{STRINGS.emailHint}</Description>
            <FieldError id="email-error" isInvalid={isEmailInvalid}>
              {STRINGS.emailError}
            </FieldError>
          </div>
          <div className="grid gap-1">
            <Label htmlFor="notes">{STRINGS.notes}</Label>
            <textarea
              id="notes"
              rows={3}
              className={CONTROL}
              value={notes}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setNotes(event.target.value)}
              aria-describedby="notes-hint"
            />
            <Description id="notes-hint">{STRINGS.notesHint}</Description>
          </div>
          <Switch label={STRINGS.modEnter} value={isModEnter} onChange={setIsModEnter} />
          <div className="flex flex-wrap items-center gap-4">
            <Button type="submit">{STRINGS.submit}</Button>
            <Text tone="muted">
              <output aria-live="polite" data-testid="submit-state">
                <bdi>{status}</bdi>
              </output>
            </Text>
          </div>
        </UiForm>
      </PageSection>
    </article>
  );
}
