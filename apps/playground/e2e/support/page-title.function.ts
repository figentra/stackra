/**
 * Stackra file contract:
 * Purpose: `pageTitle`, the title a page's level-one heading shows in a locale: a suite names its page by the English
 *          title and gets the catalogue's words for that locale (`@stackra/showcase/assets/lang/<locale>/showcase.json`),
 *          so a right-to-left run waits for the Arabic heading the page really draws.
 * Boundary: test support only; it declares no test and is not matched by the Playwright config.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0080; ADR 0022 (test placement).
 */
import showcaseAr from "@stackra/showcase/assets/lang/ar/showcase.json" with { type: "json" };
import showcaseEn from "@stackra/showcase/assets/lang/en/showcase.json" with { type: "json" };

type Tree = { readonly [key: string]: unknown };

/** The key path of the first entry whose `title` is `title`, depth first. */
function pathOf(tree: Tree, title: string): string[] | undefined {
  if (tree["title"] === title) return [];
  for (const [key, value] of Object.entries(tree)) {
    if (typeof value !== "object" || value === null) continue;
    const rest = pathOf(value as Tree, title);
    if (rest) return [key, ...rest];
  }
  return undefined;
}

/** The catalogue's title in `locale` for the page titled `title` in English; throws when the catalogue has no such title. */
export function pageTitle(title: string, locale: string): string {
  if (locale === "en") return title;
  if (locale !== "ar") throw new Error(`no catalogue for the locale "${locale}"`);
  // A component page first: "Foundations" is both a category and the foundations component page.
  const component = pathOf(showcaseEn.component, title);
  const path = component ? ["component", ...component] : pathOf(showcaseEn, title);
  if (!path) throw new Error(`no page titled "${title}" in the English catalogue`);
  const entry = path.reduce<unknown>((node, key) => (node as Tree | undefined)?.[key], showcaseAr);
  const translated = (entry as Tree | undefined)?.["title"];
  if (typeof translated !== "string") throw new Error(`"${title}" has no Arabic title`);
  return translated;
}
