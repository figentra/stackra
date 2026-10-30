/**
 * Stackra file contract:
 * Purpose: the "levels" demo of the web Heading: one heading per level from 3 to 6, each drawn in its level's look (levels 1 and
 *          2 belong to the page around the demo).
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import type { HeadingLevel } from "@stackra/ui/contracts";
import { Heading, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { HEADING_KEYS } from "#src/demos/free/heading/heading-keys.constant";

/** The demo's keys. */
const K = HEADING_KEYS.heading;

/** The levels a demo inside a page section may use. */
const LEVELS: readonly HeadingLevel[] = [3, 4, 5, 6];

/** Each heading level, from largest to smallest, with its number. */
export default function Levels() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="grid gap-2">
      {LEVELS.map((level) => (
        <Heading key={level} level={level}>
          {t(K.level, { level })}
        </Heading>
      ))}
    </div>
  );
}
