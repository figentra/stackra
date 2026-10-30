/**
 * Stackra file contract:
 * Purpose: the "language" demo of the web Typography: Text marked with its own language takes that language’s style,
 *          whatever the page direction.
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

/** Typography: Language. */
export default function Language() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="grid gap-6">
      <Text lang="ar" data-testid="lang-ar">
        {t(K.arabic_sample)}
      </Text>
      <Text lang="en" data-testid="lang-en">
        <bdi>{t(K.latin_sample)}</bdi>
      </Text>
    </div>
  );
}
