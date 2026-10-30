/**
 * Stackra file contract:
 * Purpose: the "tones" demo of the web Typography: Each tone on the page background and on a surface.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decisions 6, 7 and 9); ADR 0060 (right-to-left).
 */
import { TextTone } from "@stackra/ui/contracts";
import { Text, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { TYPOGRAPHY_KEYS } from "#src/demos/free/typography/typography-keys.constant";

/** The demo's keys. */
const K = TYPOGRAPHY_KEYS.typography;

/** The Typography demo: tones. */
export default function Tones() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {TextTone.map((each) => (
        <li key={each} className="grid gap-2">
          <Text tone={each} data-testid={`tone-${each}`}>
            <bdi>{`${each}: ${t(K.latin_sample)}`}</bdi>
          </Text>
          <div className="bg-surface p-3">
            <Text tone={each} data-testid={`tone-${each}-surface`}>
              <bdi>{`${each}: ${t(K.latin_sample)}`}</bdi>
            </Text>
          </div>
        </li>
      ))}
    </ul>
  );
}
