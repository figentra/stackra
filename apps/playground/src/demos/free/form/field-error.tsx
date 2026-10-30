/**
 * Stackra file contract:
 * Purpose: the "field-error" demo of the web Form: The message under an invalid field, shown while isInvalid is true.
 *          A valid field shows nothing.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0055 (forms); ADR 0060 (light, dark, RTL); WCAG 2.2 SC 1.3.1, 3.3.1 and 3.3.3.
 */
import { Description, FieldError, Label, useCatalogueText } from "@stackra/ui/react";
import { useId } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { FORM_KEYS } from "#src/demos/free/form/form-keys.constant";

/** The demo's keys. */
const K = FORM_KEYS.form;

/** HeroUI's own field look, for the plain controls: border, background, focus ring, invalid and disabled states. */
const CONTROL = "input w-full";

/** Form: Field error. */
export default function FieldErrorDemo() {
  const t = useCatalogueText(MESSAGES.en);
  // useId, not a literal: the page draws a demo more than once (its section, the hero, the RTL panel).
  const id = useId();
  return (
    <div className="grid max-w-sm gap-4">
      <div className="grid gap-1">
        <Label htmlFor={`${id}-invalid`} isInvalid>
          {t(K.invalid_field)}
        </Label>
        <input
          id={`${id}-invalid`}
          className={CONTROL}
          aria-invalid
          data-invalid
          aria-describedby={`${id}-invalid-error`}
        />
        <FieldError id={`${id}-invalid-error`} isInvalid>
          {t(K.invalid_message)}
        </FieldError>
      </div>
      <div className="grid gap-1">
        <Label htmlFor={`${id}-valid`}>{t(K.valid_field)}</Label>
        <input id={`${id}-valid`} className={CONTROL} aria-describedby={`${id}-valid-hint`} />
        <Description id={`${id}-valid-hint`}>{t(K.valid_note)}</Description>
        <FieldError id={`${id}-valid-error`} isInvalid={false}>
          {t(K.invalid_message)}
        </FieldError>
      </div>
    </div>
  );
}
