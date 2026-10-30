/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native PasswordField: a sign-in password with the reveal toggle.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); gap inventory row 3; ADR 0310
 *          (decision 6).
 */
import { PasswordField, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { PASSWORD_FIELD_DEMO_KEYS } from "#src/demos/free/password-field/password-field-demo-keys.constant";

/** The demo's keys. */
const K = PASSWORD_FIELD_DEMO_KEYS.demo_free.password_field.basics;

/** A password with its reveal toggle. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  return <PasswordField label={t(K.password)} description={t(K.password_hint)} isRequired />;
}
