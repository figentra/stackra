/**
 * Stackra file contract:
 * Purpose: the "context" demo of the web Chip: A chip inside a sentence, and a list of category chips drawn as list
 *          items.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decisions 3 and 7); ADR 0304; ADR 0060 (light, dark, RTL).
 */
import { Chip as UiChip, Text, useCatalogueText } from "@stackra/ui/react";
import { createElement } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { CHIP_KEYS } from "#src/demos/free/chip/chip-keys.constant";

/** The demo's keys. */
const K = CHIP_KEYS.chip;

/** The category chips of the list sample. */
const CATEGORIES = ["Billing", "Shipping", "Returns", "Support"] as const;

/** The list that lays samples out in a wrapping row. */
const ROW = "flex flex-wrap items-center gap-3";

/** Chip: In context. */
export default function Context() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="grid gap-6">
      <Text className="max-w-prose">
        <bdi>
          {t(K.sentence_prefix)}{" "}
          <UiChip tone="success" size="sm">
            {t(K.sentence_chip)}
          </UiChip>{" "}
          {t(K.sentence_suffix)}
        </bdi>
      </Text>
      <ul aria-label={t(K.categories)} className={ROW}>
        {CATEGORIES.map((name) => (
          <UiChip
            key={name}
            variant="tertiary"
            // `render` is typed for a span's ref; a plain object type lets a list item take the props.
            render={(props: object) => createElement("li", props)}
          >
            {name}
          </UiChip>
        ))}
      </ul>
    </div>
  );
}
