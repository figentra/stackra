/**
 * Stackra file contract:
 * Purpose: the "look" demo of the web Heading: the level and the look apart: a level 3 drawn as h1, a muted and a centred level 4,
 *          and a level 5 cut short.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import { Heading, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { HEADING_KEYS } from "#src/demos/free/heading/heading-keys.constant";

/** The demo's keys. */
const K = HEADING_KEYS.heading;

/** Heading: Level and look. */
export default function Look() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="grid gap-3">
      <Heading level={3} type="h1">
        {t(K.drawn_as)}
      </Heading>
      <Heading level={4} tone="muted">
        {t(K.muted)}
      </Heading>
      <Heading level={4} align="center">
        {t(K.centred)}
      </Heading>
      <div className="max-w-xs">
        <Heading level={5} isTruncated>
          {t(K.long)}
        </Heading>
      </div>
    </div>
  );
}
