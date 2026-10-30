/**
 * Stackra file contract:
 * Purpose: the "field-error" demo of the native FieldError: shown while `isInvalid` is true, nothing drawn otherwise.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { FieldError, Text, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { FORM_DEMO_KEYS } from "#src/demos/free/form/form-demo-keys.constant";

/** The demo's keys. */
const K = FORM_DEMO_KEYS.demo_free.form.field_error;

/** An invalid message, then one mounted with `isInvalid` false. */
export default function FieldErrorDemo() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-2">
      <FieldError isInvalid>{t(K.message)}</FieldError>
      <Text type="small" tone="muted">
        {t(K.valid_note)}
      </Text>
      <FieldError isInvalid={false}>{t(K.message)}</FieldError>
    </View>
  );
}
