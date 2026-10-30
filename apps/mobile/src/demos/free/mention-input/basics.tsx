/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native MentionInput: a note on an order where typing @ lists teammates under the box; the line under it says who will be told.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060;
 *          STA-1371 (wave C, owner request 2026-10-29).
 */
import { listFormatOf } from "@stackra/ui";
import { MentionInput, Text, useCatalogueText, useDesignSystem } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { MENTION_INPUT_DEMO_KEYS } from "#src/demos/free/mention-input/mention-input-demo-keys.constant";

/** The demo's keys. */
const K = MENTION_INPUT_DEMO_KEYS.demo_free.mention_input.basics;

/** The teammates who can be mentioned; names are data, so they stay as written. */
const PEOPLE = [
  { id: "sara", name: "Sara Al-Harbi" },
  { id: "salem", name: "Salem Odeh" },
  { id: "noura", name: "Noura Faisal" },
  { id: "khalid", name: "خالد العتيبي" },
  { id: "reem", name: "ريم القحطاني" },
] as const;

/** MentionInput: a note with mentions. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const { locale } = useDesignSystem();
  const [mentioned, setMentioned] = useState<readonly string[]>([]);
  const names = PEOPLE.filter((person) => mentioned.includes(person.id)).map(
    (person) => person.name,
  );
  return (
    <View className="gap-2">
      <MentionInput
        label={t(K.label)}
        placeholder={t(K.placeholder)}
        description={t(K.description)}
        people={PEOPLE}
        onMentionsChange={setMentioned}
      />
      <Text tone="muted" accessibilityLiveRegion="polite">
        {names.length > 0
          ? t(K.mentioned, { names: listFormatOf(locale).format(names) })
          : t(K.nobody)}
      </Text>
    </View>
  );
}
