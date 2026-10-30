/**
 * Stackra file contract:
 * Purpose: the "description" demo of the web Form: Help text under a field. The control names it in aria-describedby,
 *          so it is read out with the field.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0055 (forms); ADR 0060 (light, dark, RTL); WCAG 2.2 SC 1.3.1, 3.3.1 and 3.3.3.
 */
import { Description, Label, useCatalogueText } from "@stackra/ui/react";
import { useId } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { FORM_KEYS } from "#src/demos/free/form/form-keys.constant";

/** The demo's keys. */
const K = FORM_KEYS.form;

/** HeroUI's own field look, for the plain controls: border, background, focus ring, invalid and disabled states. */
const CONTROL = "input w-full";

/** The Form demo: description. */
export default function DescriptionDemo() {
  const t = useCatalogueText(MESSAGES.en);
  // useId, not a literal: the page draws a demo more than once (its section, the hero, the RTL panel).
  const id = useId();
  return (
    <div className="grid max-w-sm gap-1">
      <Label htmlFor={id}>{t(K.display_name)}</Label>
      <input id={id} className={CONTROL} aria-describedby={`${id}-hint`} />
      <Description id={`${id}-hint`}>{t(K.display_name_hint)}</Description>
    </div>
  );
}
