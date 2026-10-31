/**
 * Stackra file contract:
 * Purpose: the "reviews" demo of the native WordCloud: what a month of customer reviews mention, the most frequent words largest.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (gap wave, owner approval 2026-10-31).
 */
import { WordCloud, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { WORD_CLOUD_DEMO_KEYS } from "#src/demos/free/word-cloud/word-cloud-demo-keys.constant";

/** The demo's keys. */
const K = WORD_CLOUD_DEMO_KEYS.demo_free.word_cloud.reviews;

/** How often each word came up in October's reviews. */
const COUNTS = [
  ["delivery", 96],
  ["fresh", 81],
  ["price", 64],
  ["friendly", 58],
  ["fast", 51],
  ["late", 44],
  ["coffee", 40],
  ["clean", 33],
  ["app", 29],
  ["parking", 24],
  ["cold", 21],
  ["coupon", 18],
  ["staff", 16],
  ["quality", 14],
  ["queue", 12],
  ["music", 9],
  ["breakfast", 8],
  ["portion", 6],
] as const;

/** Word cloud: reviews. */
export default function Reviews() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <WordCloud
      label={t(K.label)}
      words={COUNTS.map(([key, value]) => ({ text: t(K[key]), value }))}
    />
  );
}
