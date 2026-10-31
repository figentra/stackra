/**
 * Stackra file contract:
 * Purpose: `wordCloudLayoutOf`, a word cloud laid out in a `width` × `height` box: words sorted by weight, sized
 *          between the smallest and largest font by the square root of their weight, then each set at the first free
 *          place on a spiral out from the middle. Right to left, the spiral turns the other way, so the picture mirrors.
 * Boundary: pure and deterministic. A word's box is estimated from its length (no text measuring in core), with a
 *           margin, so words never touch; a word with no free place left is dropped and counted.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: the same layout on web and native); ADR 0060 (right-to-left); STA-1371.
 */
import type { WordCloudWord } from "#contracts/types/word-cloud-word.type";
import type { WordCloudLayout } from "#core/types/word-cloud-layout.type";

/** A glyph's average advance and a line's height, in ems, for the semibold UI face. */
const ADVANCE = 0.6;
const LINE = 1.1;
/** The spiral's turn per step, in radians, and how far it may run. */
const TURN = 0.15;
const STEPS = 4000;

/** What the layout reads beyond the data. */
interface WordCloudBox {
  readonly width: number;
  readonly height: number;
  /** The smallest and largest font size; 12 and an eighth of the height (at most 56) by default. */
  readonly minFont?: number;
  readonly maxFont?: number;
  readonly isRtl?: boolean;
}

/**
 * The placed words of a word cloud.
 * @example wordCloudLayoutOf([{ text: "fast", value: 10 }], { width: 300, height: 200 });
 */
export function wordCloudLayoutOf(
  words: readonly WordCloudWord[],
  box: WordCloudBox,
): WordCloudLayout {
  const { width, height, minFont = 12, isRtl = false } = box;
  const maxFont = box.maxFont ?? Math.max(minFont, Math.min(56, height / 8));
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts a copy built here; toSorted is ES2023 and the base lib is ES2022
  const ranked = words.filter((word) => word.value > 0).sort((a, b) => b.value - a.value);
  const top = ranked[0]?.value ?? 0;
  const low = ranked.at(-1)?.value ?? 0;
  const taken: { x0: number; y0: number; x1: number; y1: number }[] = [];
  const placed: WordCloudLayout["words"][number][] = [];
  ranked.forEach((word, rank) => {
    const share = top > low ? Math.sqrt((word.value - low) / (top - low)) : 1;
    const fontSize = Math.round(minFont + (maxFont - minFont) * share);
    const halfWidth = (word.text.length * ADVANCE * fontSize) / 2 + 2;
    const halfHeight = (LINE * fontSize) / 2 + 1;
    for (let step = 0; step < STEPS; step += 1) {
      const angle = step * TURN;
      // An elliptic spiral as wide as the box is, so the cloud fills it rather than a circle in its middle.
      const radius = step * 0.35;
      const x = width / 2 + radius * Math.cos(angle) * (isRtl ? -1 : 1) * (width / Math.max(1, height));
      const y = height / 2 + radius * Math.sin(angle);
      const rect = { x0: x - halfWidth, y0: y - halfHeight, x1: x + halfWidth, y1: y + halfHeight };
      if (rect.x0 < 0 || rect.y0 < 0 || rect.x1 > width || rect.y1 > height) {
        if (radius > Math.hypot(width, height)) break;
        continue;
      }
      const hits = taken.some(
        (other) =>
          rect.x0 < other.x1 && rect.x1 > other.x0 && rect.y0 < other.y1 && rect.y1 > other.y0,
      );
      if (hits) continue;
      taken.push(rect);
      placed.push({ word, rank, x, y, fontSize });
      return;
    }
  });
  return { words: placed, dropped: ranked.length - placed.length };
}
