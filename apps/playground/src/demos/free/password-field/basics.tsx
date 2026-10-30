/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web PasswordField: a sign-in password with the reveal toggle and the caps-lock hint.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); gap inventory row 3; ADR 0060
 *          (light, dark, RTL).
 */
import { PasswordField as UiPasswordField, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { PASSWORD_FIELD_KEYS } from "#src/demos/free/password-field/password-field-keys.constant";

/** The demo's keys. */
const K = PASSWORD_FIELD_KEYS.password_field;

/** Password field: Password. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="max-w-sm">
      <UiPasswordField label={t(K.password)} description={t(K.password_hint)} isRequired />
    </div>
  );
}
