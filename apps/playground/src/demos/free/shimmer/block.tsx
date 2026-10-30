/**
 * Stackra file contract:
 * Purpose: the "block" demo of the web Shimmer: a question about this month's orders, with placeholder lines where the
 *          summary will appear.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { Shimmer, Text, useCatalogueText } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { SHIMMER_KEYS } from "#src/demos/free/shimmer/shimmer-keys.constant";

/** The demo's keys. */
const K = SHIMMER_KEYS.shimmer.block;

/** A block of four shimmering lines while an answer loads. */
export default function Block() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="grid w-full max-w-md gap-3">
      <Text className="font-medium">{t(K.question)}</Text>
      <Shimmer kind="block" lines={4} />
    </div>
  );
}
