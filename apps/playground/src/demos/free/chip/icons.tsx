/**
 * Stackra file contract:
 * Purpose: the "icons" demo of the web Chip: A start icon, an end icon that mirrors in right-to-left, and both. Icons
 *          are the size of the text.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decisions 3 and 7); ADR 0304; ADR 0060 (light, dark, RTL).
 */
import { Chip as UiChip, Icon, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { CHIP_KEYS } from "#src/demos/free/chip/chip-keys.constant";

/** The demo's keys. */
const K = CHIP_KEYS.chip;

/** The list that lays samples out in a wrapping row. */
const ROW = "flex flex-wrap items-center gap-3";

/** The Chip demo: icons. */
export default function Icons() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <ul className={ROW}>
      <li>
        <UiChip tone="success" startIcon="check">
          {t(K.start)}
        </UiChip>
      </li>
      <li>
        <UiChip endIcon={<Icon name="chevron-right" />}>{t(K.end)}</UiChip>
      </li>
      <li>
        <UiChip
          variant="soft"
          tone="accent"
          size="lg"
          startIcon="check"
          endIcon={<Icon name="chevron-right" />}
        >
          {t(K.both)}
        </UiChip>
      </li>
    </ul>
  );
}
