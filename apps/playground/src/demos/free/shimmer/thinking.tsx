/**
 * Stackra file contract:
 * Purpose: the "thinking" demo of the web Shimmer: the default "Thinking…" and a step the assistant names, each with
 *          the light sweeping in the reading direction.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { Shimmer, useCatalogueText } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { SHIMMER_KEYS } from "#src/demos/free/shimmer/shimmer-keys.constant";

/** The demo's keys. */
const K = SHIMMER_KEYS.shimmer.thinking;

/** A plain shimmer and one that shimmers its own text. */
export default function Thinking() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="grid justify-items-start gap-3">
      <Shimmer />
      <Shimmer>{t(K.searching)}</Shimmer>
    </div>
  );
}
