/**
 * Stackra file contract:
 * Purpose: `loadMessages(catalogues, locale)`, the consumer of the catalogue loaders gen writes in `#stackra/i18n`
 *          (the member's own lang and its declared packages'): loads every namespace along the locale's fallback chain
 *          (`ar-SA`, then `ar`, then `en`) and merges it farthest first with `mergeCatalogues`, so the nearest locale
 *          wins key by key.
 * Boundary: pure apart from the loaders it calls; a locale without a file for a namespace is skipped (a regional
 *           overlay holds only the keys that differ). A namespace with no file anywhere on the chain is left out.
 * Runtime: isomorphic
 * Governing contract: ADR 0080 (as amended by 0305 conventions 1: regional overlays fall back to their base language),
 *                     ADR 0234; STA-1309 (gen's catalogue-loader target).
 */
import { mergeCatalogues } from "#core/functions/merge-catalogues.function";
import type { LoadCatalogue } from "#core/types/load-catalogue.type";
import type { Messages } from "#core/types/messages.type";

/** The default locale every chain ends at (the source of every catalogue). */
const DEFAULT_LOCALE = "en";

/** `locale`'s fallback chain, farthest first: `en`, then the base language, then the locale itself. */
function chainOf(locale: string): string[] {
  const language = locale.split("-")[0] ?? locale;
  return [...new Set([DEFAULT_LOCALE, language, locale])];
}

/**
 * The merged messages of `locale`, by namespace.
 *
 * @param catalogues - namespace to locale to loader: gen's `catalogues` from `#stackra/i18n`.
 * @param locale - the active locale, a `Locale` code (`ar-SA`).
 * @example
 * const messages = await loadMessages(catalogues, "ar-SA"); // `ar-SA` over `ar` over `en`, per namespace
 */
export async function loadMessages(
  catalogues: { readonly [namespace: string]: { readonly [locale: string]: LoadCatalogue } },
  locale: string,
): Promise<Messages> {
  const chain = chainOf(locale);
  const entries = await Promise.all(
    Object.entries(catalogues).map(async ([namespace, loaders]) => {
      const loaded = await Promise.all(
        chain.flatMap((code) => {
          const load = loaders[code];
          return load === undefined ? [] : [load().then((module) => module.default)];
        }),
      );
      return [namespace, loaded] as const;
    }),
  );
  return Object.fromEntries(
    entries
      .filter(([, loaded]) => loaded.length > 0)
      .map(([namespace, loaded]) => [namespace, mergeCatalogues(loaded)]),
  );
}
