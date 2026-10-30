/**
 * Stackra file contract:
 * Purpose: the "inline" demo of the web Typography: A Text drawn as a span inside a sentence, and small muted text.
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

/** Typography: Inline. */
export default function Inline() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="grid gap-6">
      <p>
        <bdi>
          {t(K.inline_before)}
          <Text tone="accent" weight="semibold" render={(props) => <span {...props} />}>
            {t(K.inline_text)}
          </Text>
          {t(K.inline_after)}
        </bdi>
      </p>
      <Text type="small" tone="muted">
        <bdi>{t(K.small)}</bdi>
      </Text>
    </div>
  );
}
