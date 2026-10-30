/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native Disclosure: delivery details under a product, shown on demand.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060;
 *          STA-1371 (wave C).
 */
import { Disclosure, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { DISCLOSURE_DEMO_KEYS } from "#src/demos/free/disclosure/disclosure-demo-keys.constant";

/** The demo's keys. */
const K = DISCLOSURE_DEMO_KEYS.demo_free.disclosure.basics;

/** Disclosure: one section, closed at first. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  return <Disclosure title={t(K.title)}>{t(K.body)}</Disclosure>;
}
