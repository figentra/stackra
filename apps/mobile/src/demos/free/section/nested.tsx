/**
 * Stackra file contract:
 * Purpose: the "nested" demo of the native Section: `headingLevel` keeps the outline right, 2 outside and 3 inside.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Section, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { SECTION_DEMO_KEYS } from "#src/demos/free/section/section-demo-keys.constant";

/** The demo's keys. */
const K = SECTION_DEMO_KEYS.demo_free.section.nested;

/** A section inside a section. */
export default function Nested() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Section title={t(K.heading)} description={t(K.body)}>
      <Section
        variant="secondary"
        headingLevel={3}
        title={t(K.inner_heading)}
        description={t(K.inner_body)}
      />
    </Section>
  );
}
