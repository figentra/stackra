/**
 * Stackra file contract:
 * Purpose: the "weight" demo of the web Typography: HeroUI’s weight passes through; the theme restates the modifiers
 *          after its types.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decisions 6, 7 and 9); ADR 0060 (right-to-left).
 */
import { Text, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { TYPOGRAPHY_KEYS } from "#src/demos/free/typography/typography-keys.constant";

/** The demo's keys. */
const K = TYPOGRAPHY_KEYS.typography;

/** The Typography demo: weight. */
export default function Weight() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Text weight="bold" data-testid="weight-bold">
      <bdi>{t(K.latin_sample)}</bdi>
    </Text>
  );
}
