/**
 * Stackra file contract:
 * Purpose: the "rich" demo of the web Accordion: A title or content that is not a string is drawn as it is, here a
 *          link in a section.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0313; ADR 0060 (light, dark, RTL).
 */
import { Accordion as UiAccordion, Link, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { ACCORDION_KEYS } from "#src/demos/free/accordion/accordion-keys.constant";

/** The demo's keys. */
const K = ACCORDION_KEYS.accordion;

/** The width of one accordion in a row. */
const WIDTH = "w-96 max-w-full";

/** Accordion: Rich content. */
export default function Rich() {
  const t = useCatalogueText(MESSAGES.en);
  /** The same sections with a link in one. */
  const FAQ_RICH = [
    {
      id: "shipping",
      title: t(K.sample.how_long_does_shipping_take),
      content: t(K.sample.orders_ship_within_two_working),
    },
    {
      id: "returns",
      title: t(K.sample.can_i_return_an_order),
      content: (
        <Link href="https://example.com/returns" isExternal>
          {t(K.docs_link)}
        </Link>
      ),
    },
  ] as const;
  return <UiAccordion items={FAQ_RICH} className={WIDTH} />;
}
