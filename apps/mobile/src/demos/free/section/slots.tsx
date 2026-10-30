/**
 * Stackra file contract:
 * Purpose: the "slots" demo of the native Section: `startContent` leads the title; `endContent` follows the actions.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Avatar, Chip, Section, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { SECTION_DEMO_KEYS } from "#src/demos/free/section/section-demo-keys.constant";

/** The demo's keys. */
const K = SECTION_DEMO_KEYS.demo_free.section.slots;

/** The section's body: an address, not translated copy. */
const EMAIL = "ada@example.com";

/** An avatar and a chip around the title. */
export default function Slots() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Section
      title={t(K.heading)}
      description={t(K.body)}
      startContent={<Avatar name="Ada Lovelace" />}
      endContent={<Chip size="sm">{t(K.chip)}</Chip>}
    >
      {EMAIL}
    </Section>
  );
}
