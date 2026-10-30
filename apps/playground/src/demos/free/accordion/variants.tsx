/**
 * Stackra file contract:
 * Purpose: the "variants" demo of the web Accordion: The default sits on the page; the surface variant is a tinted
 *          panel of its own.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0313; ADR 0060 (light, dark, RTL).
 */
import { AccordionVariant } from "@stackra/ui/contracts";
import { Accordion as UiAccordion, Text, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { ACCORDION_KEYS } from "#src/demos/free/accordion/accordion-keys.constant";

/** The demo's keys. */
const K = ACCORDION_KEYS.accordion;

/** The grid that lays the samples out in a wrapping row. */
const ROW = "flex flex-wrap items-start gap-8";

/** The width of one accordion in a row. */
const WIDTH = "w-96 max-w-full";

/** The Accordion demo: variants. */
export default function Variants() {
  const t = useCatalogueText(MESSAGES.en);
  /** The sections of most samples. */
  const FAQ = [
    {
      id: "shipping",
      title: t(K.sample.how_long_does_shipping_take),
      content: t(K.sample.orders_ship_within_two_working),
    },
    {
      id: "returns",
      title: t(K.sample.can_i_return_an_order),
      content: t(K.sample.yes_within_thirty_days_and),
    },
    {
      id: "warranty",
      title: t(K.sample.is_there_a_warranty),
      content: t(K.sample.every_product_has_a_two),
    },
  ] as const;
  return (
    <div className={ROW}>
      {AccordionVariant.map((variant) => (
        <div key={variant} className="grid gap-2">
          <Text tone="muted">{t(K.variant, { variant })}</Text>
          <UiAccordion items={FAQ} variant={variant} className={WIDTH} />
        </div>
      ))}
    </div>
  );
}
