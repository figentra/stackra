/**
 * Stackra file contract:
 * Purpose: the "variants" demo of the native Accordion: each `variant`, on the page's surface or as its own panel.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { AccordionVariant } from "@stackra/ui/contracts";
import { Accordion, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { ACCORDION_DEMO_KEYS } from "#src/demos/free/accordion/accordion-demo-keys.constant";

/** The demo's keys. */
const K = ACCORDION_DEMO_KEYS.demo_free.accordion.variants;

/** One accordion per variant, its first section open. */
export default function Variants() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-4">
      {AccordionVariant.map((variant) => (
        <Accordion
          key={variant}
          items={[
            { id: "first", title: t(K.first, { name: variant }), content: t(K.body) },
            { id: "second", title: t(K.second, { name: variant }), content: t(K.body) },
          ]}
          variant={variant}
          defaultExpandedKeys={["first"]}
        />
      ))}
    </View>
  );
}
