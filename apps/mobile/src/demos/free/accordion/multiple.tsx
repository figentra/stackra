/**
 * Stackra file contract:
 * Purpose: the "multiple" demo of the native Accordion: `canExpandMultiple`, two sections open together.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import type { AccordionItem } from "@stackra/ui/contracts";
import { Accordion, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { ACCORDION_DEMO_KEYS } from "#src/demos/free/accordion/accordion-demo-keys.constant";

/** The demo's keys. */
const K = ACCORDION_DEMO_KEYS.demo_free.accordion.faq;

/** Sections stay open together; two start open. */
export default function Multiple() {
  const t = useCatalogueText(MESSAGES.en);
  const items: readonly AccordionItem[] = [
    { id: "shipping", title: t(K.shipping_title), content: t(K.shipping_body) },
    { id: "payment", title: t(K.payment_title), content: t(K.payment_body) },
    { id: "returns", title: t(K.returns_title), content: t(K.returns_body), isDisabled: true },
    { id: "support", title: t(K.support_title), content: t(K.support_body) },
  ];
  return (
    <Accordion items={items} canExpandMultiple defaultExpandedKeys={["shipping", "support"]} />
  );
}
