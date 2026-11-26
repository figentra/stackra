/**
 * Stackra file contract:
 * Purpose: the "decorative" demo of the web Illustration: the monitor drawing beside a call to try the CLI, with no
 *          `alt`, so it is decoration hidden from assistive tech and the heading carries the meaning.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown. The four tone
 *           layers are copies of `assets/landing/art/monitor.*.svg` served from the playground's `public/art/`.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (illustrations never mirror); STA-2041.
 */
import { Heading, Illustration, Text, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { ILLUSTRATION_KEYS } from "#src/demos/free/illustration/illustration-keys.constant";

/** The demo's keys. */
const K = ILLUSTRATION_KEYS.illustration;

/** Illustration: decoration only. */
export default function Decorative() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="flex max-w-lg flex-wrap items-center gap-6">
      <div className="grid min-w-48 flex-1 gap-2">
        <Heading level={3}>{t(K.try_title)}</Heading>
        <Text tone="muted">{t(K.try_text)}</Text>
      </div>
      <Illustration src="/art/monitor" width={328} height={426} className="w-44 shrink-0" />
    </div>
  );
}
