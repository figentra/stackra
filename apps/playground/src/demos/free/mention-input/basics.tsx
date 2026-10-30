/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web MentionInput: a note on an order where typing @ suggests teammates; the line under it lists who will be told.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave C, owner request 2026-10-29).
 */
import { MentionInput, Text, useCatalogueText, useDesignSystem } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { MENTION_INPUT_KEYS } from "#src/demos/free/mention-input/mention-input-keys.constant";

/** The demo's keys. */
const K = MENTION_INPUT_KEYS.mention_input.basics;

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
    <div className="grid w-full max-w-md gap-2">
      <MentionInput
        label={t(K.label)}
        placeholder={t(K.placeholder)}
        description={t(K.description)}
        people={PEOPLE}
        onMentionsChange={setMentioned}
      />
      <Text tone="muted" aria-live="polite">
        {names.length > 0
          ? t(K.mentioned, { names: new Intl.ListFormat(locale).format(names) })
          : t(K.nobody)}
      </Text>
    </div>
  );
}
