/**
 * Stackra file contract:
 * Purpose: the "kinds" demo of the native TextField: `type` sets the keyboard, the masking and the capitalisation.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { TextFieldType } from "@stackra/ui/contracts";
import { TextField, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { TEXT_FIELD_DEMO_KEYS } from "#src/demos/free/text-field/text-field-demo-keys.constant";

/** The demo's keys. */
const K = TEXT_FIELD_DEMO_KEYS.demo_free.text_field.kinds;

/** One field per kind. */
export default function Kinds() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-4">
      {TextFieldType.map((kind) => (
        <TextField key={kind} label={t(K.label, { kind })} type={kind} />
      ))}
    </View>
  );
}
