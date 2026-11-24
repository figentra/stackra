/**
 * Stackra file contract:
 * Purpose: `findShowcaseMisses`, the entries whose web showcase lacks a playground route, a demo, an English or an
 *          Arabic title label, or a test. Only built entries on the react platform count: a planned entry has nothing
 *          yet and a native-only entry has no playground page.
 * Boundary: a pure function over what it is given; it reads no file.
 * Runtime: node
 * Governing contract: STA-2738 (the `showcase:coverage` script), a child of STA-2705.
 */
import { componentKeys } from "../src/registry/component-keys.function.ts";
import { lookupMessage } from "../src/registry/lookup-message.function.ts";
import type { ShowcaseCoverageInput } from "./showcase-coverage-input.type.ts";
import type { ShowcaseGap } from "./showcase-gap.type.ts";
import type { ShowcaseMiss } from "./showcase-miss.type.ts";

/** The misses, in entry order; an entry with no gap is left out. */
export function findShowcaseMisses(input: ShowcaseCoverageInput): ShowcaseMiss[] {
  const misses: ShowcaseMiss[] = [];
  for (const entry of input.entries) {
    if (entry.status === "planned" || !entry.platforms.includes("react")) continue;
    const key = `${entry.tier}/${entry.slug}`;
    const title = componentKeys(entry).title;
    const gaps: ShowcaseGap[] = [];
    const route = entry.tier === "pro" ? `pro-${entry.slug}` : entry.slug;
    if (!input.routes.has(route)) gaps.push("route");
    if (!input.demos.has(key)) gaps.push("demo");
    if (lookupMessage(input.catalogues.en, title) === undefined) gaps.push("en");
    if (lookupMessage(input.catalogues.ar, title) === undefined) gaps.push("ar");
    if (!input.tests.has(entry.slug)) gaps.push("test");
    if (gaps.length > 0) misses.push({ key, gaps });
  }
  return misses;
}
