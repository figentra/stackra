/**
 * Stackra file contract:
 * Purpose: the "heading-levels" demo of the web Typography: A nested run of levels, each in the style of its level.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decisions 6, 7 and 9); ADR 0060 (right-to-left).
 */
import { Heading, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { TYPOGRAPHY_KEYS } from "#src/demos/free/typography/typography-keys.constant";

/** The demo's keys. */
const K = TYPOGRAPHY_KEYS.typography;

/** Typography: Heading levels. */
export default function HeadingLevels() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="grid gap-6">
      <Heading level={3} data-testid="level-3">
        {t(K.level, { level: 3 })}
      </Heading>
      <Heading level={4} data-testid="level-4">
        {t(K.level, { level: 4 })}
      </Heading>
      <Heading level={5} data-testid="level-5">
        {t(K.level, { level: 5 })}
      </Heading>
      <Heading level={6} data-testid="level-6">
        {t(K.level, { level: 6 })}
      </Heading>
    </div>
  );
}
