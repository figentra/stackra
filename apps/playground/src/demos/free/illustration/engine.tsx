/**
 * Stackra file contract:
 * Purpose: the "engine" demo of the web Illustration: the landing engine drawing, named by `alt`, in the page's colour
 *          roles, so it follows the theme, the scheme and the brand.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown. The four tone
 *           layers are copies of `assets/landing/art/engine.*.svg` served from the playground's `public/art/`.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (illustrations never mirror); STA-2041.
 */
import { Illustration, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { ILLUSTRATION_KEYS } from "#src/demos/free/illustration/illustration-keys.constant";

/** The demo's keys. */
const K = ILLUSTRATION_KEYS.illustration;

/** Illustration: the engine, named. */
export default function Engine() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Illustration
      src="/art/engine"
      width={505}
      height={588}
      alt={t(K.engine_alt)}
      className="w-64 max-w-full"
    />
  );
}
