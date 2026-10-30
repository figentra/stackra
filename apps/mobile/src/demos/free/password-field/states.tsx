/**
 * Stackra file contract:
 * Purpose: the "states" demo of the native PasswordField: a kiosk exit code without the reveal toggle, and a disabled field.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); gap inventory row 3; ADR 0310
 *          (decision 6).
 */
import { PasswordField, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { PASSWORD_FIELD_DEMO_KEYS } from "#src/demos/free/password-field/password-field-demo-keys.constant";

/** The demo's keys. */
const K = PASSWORD_FIELD_DEMO_KEYS.demo_free.password_field.states;

/** No reveal toggle, and disabled. */
export default function States() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-4">
      <PasswordField label={t(K.kiosk)} mode="pin" pinLength={6} isRevealable={false} />
      <PasswordField label={t(K.disabled)} defaultValue="locked-secret" isDisabled />
    </View>
  );
}
