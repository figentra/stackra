/**
 * Stackra file contract:
 * Purpose: the "emails" demo of the native Tag input: invite teammates by email; a bad address is refused with a reason.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave A, owner request 2026-10-29).
 */
import { TagInput, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { TAG_INPUT_DEMO_KEYS } from "#src/demos/free/tag-input/tag-input-demo-keys.constant";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

/** The demo's keys. */
const K = TAG_INPUT_DEMO_KEYS.demo_free.tag_input.emails;

/** Tag input: invite teammates by email; a bad address is refused with a reason. */
export default function Emails() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View>
      <TagInput
        label={t(K.label)}
        placeholder={t(K.placeholder)}
        defaultValue={["sara@almarai.example"]}
        validate={(tag) => (EMAIL.test(tag) ? undefined : t(K.invalid, { tag }))}
      />
    </View>
  );
}
