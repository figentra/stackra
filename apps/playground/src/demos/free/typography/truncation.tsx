/**
 * Stackra file contract:
 * Purpose: the "truncation" demo of the web Typography: The same sentence wrapped and cut to one line, and a heading
 *          cut to one line.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decisions 6, 7 and 9); ADR 0060 (right-to-left).
 */
import { Heading, Text, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { TYPOGRAPHY_KEYS } from "#src/demos/free/typography/typography-keys.constant";

/** The demo's keys. */
const K = TYPOGRAPHY_KEYS.typography;

/** Typography: Truncation. */
export default function Truncation() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="grid max-w-48 gap-3 border border-border p-3">
      <Text data-testid="wrapped">
        <bdi>{t(K.long_sample)}</bdi>
      </Text>
      <Text isTruncated data-testid="truncated">
        <bdi>{t(K.long_sample)}</bdi>
      </Text>
      <Heading level={3} type="h4" isTruncated data-testid="truncated-heading">
        <bdi>{t(K.long_sample)}</bdi>
      </Heading>
    </div>
  );
}
