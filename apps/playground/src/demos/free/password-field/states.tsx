/**
 * Stackra file contract:
 * Purpose: the "states" demo of the web PasswordField: a kiosk exit code without the reveal toggle, and a disabled field.
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

/** Password field: States. */
export default function States() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="grid max-w-sm gap-4">
      <UiPasswordField label={t(K.kiosk)} mode="pin" pinLength={6} isRevealable={false} />
      <UiPasswordField label={t(K.disabled)} defaultValue="locked-secret" isDisabled />
    </div>
  );
}
