/**
 * Stackra file contract:
 * Purpose: the "live" demo of the web Form: A form that checks the email when you submit. With the switch on, Enter
 *          in a text box does not submit; Cmd or Ctrl plus Enter does.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0055 (forms); ADR 0060 (light, dark, RTL); WCAG 2.2 SC 1.3.1, 3.3.1 and 3.3.3.
 */
import {
  Button,
  Description,
  FieldError,
  Form as UiForm,
  Label,
  Switch,
  Text,
  useCatalogueText,
} from "@stackra/ui/react";
import { useId, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { FORM_KEYS } from "#src/demos/free/form/form-keys.constant";

/** The demo's keys. */
const K = FORM_KEYS.form;

/** HeroUI's own field look, for the plain controls: border, background, focus ring, invalid and disabled states. */
const CONTROL = "input w-full";

/** One address, loosely: something, an at sign, something, a dot, something. The page's check, not a standard. */
const EMAIL = /^\S+@\S+\.\S+$/;

/** Form: Try it. */
export default function Live() {
  const t = useCatalogueText(MESSAGES.en);
  // useId, not a literal: the page draws a demo more than once (its section, the hero, the RTL panel).
  const id = useId();
  const [isModEnter, setIsModEnter] = useState(true);

  const [email, setEmail] = useState("");

  const [notes, setNotes] = useState("");

  const [isEmailInvalid, setIsEmailInvalid] = useState(false);

  const [sentCount, setSentCount] = useState(0);

  const [status, setStatus] = useState<string>(t(K.not_sent));

  const emailRef = useRef<HTMLInputElement>(null);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const isValid = EMAIL.test(email);
    setIsEmailInvalid(!isValid);
    if (!isValid) {
      setStatus(t(K.refused));
      // Moving focus to the first invalid field tells a keyboard or screen-reader user where the problem is.
      emailRef.current?.focus();
      return;
    }
    setSentCount(sentCount + 1);
    setStatus(t(K.sent, { count: sentCount + 1, email }));
  };

  return (
    <UiForm
      aria-label={t(K.form_name)}
      validationBehavior="aria"
      isSubmitOnModEnter={isModEnter}
      onSubmit={onSubmit}
      className="grid max-w-sm gap-4"
    >
      <div className="grid gap-1">
        <Label htmlFor={`${id}-email`} isRequired isInvalid={isEmailInvalid}>
          {t(K.email)}
        </Label>
        <input
          id={`${id}-email`}
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
          aria-describedby={
            isEmailInvalid ? `${id}-email-hint ${id}-email-error` : `${id}-email-hint`
          }
        />
        <Description id={`${id}-email-hint`}>{t(K.email_hint)}</Description>
        <FieldError id={`${id}-email-error`} isInvalid={isEmailInvalid}>
          {t(K.email_error)}
        </FieldError>
      </div>
      <div className="grid gap-1">
        <Label htmlFor={`${id}-notes`}>{t(K.notes)}</Label>
        <textarea
          id={`${id}-notes`}
          rows={3}
          className={CONTROL}
          value={notes}
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setNotes(event.target.value)}
          aria-describedby={`${id}-notes-hint`}
        />
        <Description id={`${id}-notes-hint`}>{t(K.notes_hint)}</Description>
      </div>
      <Switch label={t(K.mod_enter)} value={isModEnter} onChange={setIsModEnter} />
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit">{t(K.submit)}</Button>
        <Text tone="muted">
          <output aria-live="polite" data-testid="submit-state">
            <bdi>{status}</bdi>
          </output>
        </Text>
      </div>
    </UiForm>
  );
}
