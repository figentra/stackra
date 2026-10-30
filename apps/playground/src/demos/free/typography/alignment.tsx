/**
 * Stackra file contract:
 * Purpose: the "alignment" demo of the web Typography: Start and end follow the page direction: switch to Arabic and
 *          they swap.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decisions 6, 7 and 9); ADR 0060 (right-to-left).
 */
import { TextAlign } from "@stackra/ui/contracts";
import { Text, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { TYPOGRAPHY_KEYS } from "#src/demos/free/typography/typography-keys.constant";

/** The demo's keys. */
const K = TYPOGRAPHY_KEYS.typography;

/** The Typography demo: alignment. */
export default function Alignment() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <ul className="grid gap-3">
      {TextAlign.map((align) => (
        <li key={align} className="grid gap-1 border border-border p-3">
          <Text type="caption" tone="muted">
            <bdi dir="ltr">{align}</bdi>
          </Text>
          <Text align={align} data-testid={`align-${align}`}>
            <bdi>{t(K.long_sample)}</bdi>
          </Text>
        </li>
      ))}
    </ul>
  );
}
