/**
 * Stackra file contract:
 * Purpose: the "horizontal" demo of the web Separator: Between two paragraphs, the full width of the container.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0304; ADR 0060 (light, dark, RTL).
 */
import { Separator as UiSeparator, Text, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SEPARATOR_KEYS } from "#src/demos/free/separator/separator-keys.constant";

/** The demo's keys. */
const K = SEPARATOR_KEYS.separator;

/** The Separator demo: horizontal. */
export default function Horizontal() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="grid max-w-prose gap-3">
      <Text>
        <bdi>{t(K.before)}</bdi>
      </Text>
      <UiSeparator />
      <Text>
        <bdi>{t(K.after)}</bdi>
      </Text>
    </div>
  );
}
