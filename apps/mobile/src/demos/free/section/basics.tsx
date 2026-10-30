/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native Section: a card with a title, a line under it and a body.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Section, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { SECTION_DEMO_KEYS } from "#src/demos/free/section/section-demo-keys.constant";

/** The demo's keys. */
const K = SECTION_DEMO_KEYS.demo_free.section.basics;

/** A shipping address. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Section title={t(K.heading)} description={t(K.body)}>
      {t(K.content)}
    </Section>
  );
}
