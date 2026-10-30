/**
 * Stackra file contract:
 * Purpose: the "live" demo of the web Accordion: Open and close sections, or use the buttons: the page holds the open
 *          ids and reports them in the order of the sections.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0313; ADR 0060 (light, dark, RTL).
 */
import { Accordion as UiAccordion, Button, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { ACCORDION_KEYS } from "#src/demos/free/accordion/accordion-keys.constant";

/** The demo's keys. */
const K = ACCORDION_KEYS.accordion;

/** The width of one accordion in a row. */
const WIDTH = "w-96 max-w-full";

/** Accordion: Try it. */
export default function Live() {
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
  /** The ids of every section, for the live example's buttons. */
  const ALL_IDS = FAQ.map((section) => section.id);
  const [open, setOpen] = useState<readonly string[]>(["shipping"]);

  return (
    <div className="grid gap-6">
      <UiAccordion
        items={FAQ}
        canExpandMultiple
        expandedKeys={open}
        onExpandedChange={setOpen}
        className={WIDTH}
      />
      <Text role="status" data-testid="accordion-open" tone="muted">
        {t(K.open, { keys: open.join(", ") || "none" })}
      </Text>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onPress={() => setOpen(ALL_IDS)}>
          {t(K.expand_all)}
        </Button>
        <Button variant="secondary" onPress={() => setOpen([])}>
          {t(K.collapse_all)}
        </Button>
      </div>
    </div>
  );
}
