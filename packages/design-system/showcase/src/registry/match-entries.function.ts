/**
 * Stackra file contract:
 * Purpose: `matchEntries`, the showcases' one search rule (moved from mobile `match-pages.ts`): every word of the query must
 *          appear in a doc; a title hit outranks a keyword, a heading, a prop and a description hit.
 * Boundary: a pure function over `SearchDoc` rows (the generated `search/index.json`); it reads no UI state.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 7.5.
 */
import type { Platform } from "#src/enums/platform.enum";
import type { SearchDoc } from "#src/types/search-doc.type";
import type { SearchHit } from "#src/types/search-hit.type";

/** The weight of each field a word can match in. */
const WEIGHTS = { title: 8, keyword: 4, heading: 3, prop: 3, description: 1 } as const;

/** The best field `word` matches in `doc`, or undefined. */
function bestMatch(
  doc: SearchDoc,
  word: string,
): { reason: SearchHit["reason"]; matched: string; score: number } | undefined {
  const has = (text: string) => text.toLowerCase().includes(word);
  if (has(doc.title)) {
    return {
      reason: "title",
      matched: doc.title,
      score: WEIGHTS.title + (doc.title.toLowerCase().startsWith(word) ? 2 : 0),
    };
  }
  const keyword = doc.keywords.find(has);
  if (keyword !== undefined) return { reason: "keyword", matched: keyword, score: WEIGHTS.keyword };
  const prop = doc.propNames.find(has);
  if (prop !== undefined) return { reason: "prop", matched: prop, score: WEIGHTS.prop };
  const heading = doc.headings.find(has);
  if (heading !== undefined) return { reason: "heading", matched: heading, score: WEIGHTS.heading };
  if (has(doc.description)) {
    return { reason: "description", matched: doc.description, score: WEIGHTS.description };
  }
  return undefined;
}

/**
 * The docs that contain every word of `query` (ignoring case) in `lang`, best first; ties keep the given order.
 * An empty query matches nothing.
 */
export function matchEntries(
  docs: readonly SearchDoc[],
  query: string,
  options: { readonly lang?: string; readonly platform?: Platform; readonly limit?: number } = {},
): SearchHit[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const hits: SearchHit[] = [];
  for (const doc of docs) {
    if (options.lang && doc.lang !== options.lang) continue;
    if (options.platform && !doc.platforms.includes(options.platform)) continue;
    const matches = words.map((word) => bestMatch(doc, word));
    if (matches.some((match) => match === undefined)) continue;
    const found = matches.filter((match) => match !== undefined);
    const best = found.reduce((top, match) => (match.score > top.score ? match : top));
    const score = found.reduce((sum, match) => sum + match.score, 0);
    hits.push({ doc, score, reason: best.reason, matched: best.matched });
  }
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  const sorted = [...hits].sort((a, b) => b.score - a.score);
  return options.limit === undefined ? sorted : sorted.slice(0, options.limit);
}
