/**
 * Stackra file contract:
 * Purpose: `emitI18n`, the i18n target: `.stackra/gen/i18n.ts`, reached as `#stackra/i18n`, with `I18n`, the typed key
 *          tree of the member's lang catalogues and of the namespaces its declared `@stackra/*` packages ship
 *          (`I18n.carts.nav.sales` is `"carts::nav.sales"`, `I18n.loyalty_kit.enums.loyalty_tier.gold` comes from
 *          `@stackra/loyalty-kit`; built by `keys(...)` of `@stackra/i18n`), `locales`, the locale folders under
 *          the member's `assets/lang`, `catalogues`, one lazy `LoadCatalogue` per namespace and locale file (the
 *          member's own through `../../assets/lang/...`, a package's through its `./assets/*` export, a consumed service's through its folder
 *          relative to the member, STA-1363), and
 *          `loadMessages(locale)`, those loaders merged along the locale's fallback chain by `@stackra/i18n`
 *          (STA-1309).
 * Boundary: pure. The tree is `i18nTree(ir)` (each catalogue set's base locale; `$` notes left out); a namespace clash
 *           is refused by `checkI18n` before this runs. Nothing is written for a member with no namespace at all, or
 *           one that does not declare `@stackra/i18n` (the import would not resolve). A loader exists only for a file
 *           that exists, so a regional overlay without a file has none.
 * Runtime: isomorphic
 * Governing contract: ADR 0268 (R15: typed keys); ADR 0231 (`<module>::<path>` lookups); registry v3.1 section 5
 *                     item 7 (`#stackra/i18n`); STA-1293; STA-1298 (package namespaces merged).
 */
import { generatedHeader } from "#core/functions/generated-header.function";
import { i18nTree } from "#core/functions/i18n-tree.function";
import type { GeneratedFile } from "#core/types/generated-file.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** The member's catalogue file, from `.stackra/gen/i18n.ts`. */
const OWN_LANG = "../../assets/lang";

/** Namespace to locale to the import specifier of its file, sorted: the member's own, then each package's. */
function loaderSpecifiers(ir: MemberIR): Map<string, Map<string, string>> {
  const sets = [
    { from: OWN_LANG, catalogues: ir.catalogues ?? {} },
    ...(ir.packageCatalogues ?? []).map((shipped) => ({
      // A consumed service's lang is a folder of the repo, imported relative to `.stackra/gen/` (STA-1363).
      from: shipped.from === undefined ? `${shipped.package}/assets/lang` : `../../${shipped.from}`,
      catalogues: shipped.catalogues,
    })),
  ];
  const loaders = new Map<string, Map<string, string>>();
  for (const { from, catalogues } of sets)
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
    for (const locale of Object.keys(catalogues).sort())
      // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
      for (const namespace of Object.keys(catalogues[locale] ?? {}).sort()) {
        const byLocale = loaders.get(namespace) ?? new Map<string, string>();
        // A clash is refused by checkI18n before this runs; the first owner keeps the namespace, as in i18nTree.
        if (!byLocale.has(locale)) byLocale.set(locale, `${from}/${locale}/${namespace}.json`);
        loaders.set(namespace, byLocale);
      }
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  return new Map([...loaders].sort(([left], [right]) => left.localeCompare(right)));
}

/**
 * The `#stackra/i18n` file of `ir`, or undefined when it has no namespace or does not declare `@stackra/i18n`.
 *
 * @param ir - the member read by discovery, with its `catalogues` and `packageCatalogues`.
 * @example
 * emitI18n(ir)?.path; // ".stackra/gen/i18n.ts"
 */
export function emitI18n(ir: MemberIR): GeneratedFile | undefined {
  if (ir.packages !== undefined && !ir.packages.includes("@stackra/i18n")) return undefined;
  const { namespaces } = i18nTree(ir);
  if (namespaces.size === 0) return undefined;
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  const locales = Object.keys(ir.catalogues ?? {}).sort();
  const tree = Object.fromEntries(
    [...namespaces].map(([namespace, { node }]) => [namespace, node]),
  );
  const shipped = [...new Set([...namespaces.values()].flatMap((entry) => entry.package ?? []))];
  const content = [
    generatedHeader({
      from:
        "assets/lang/<locale>/*.json (keys from each base locale)" +
        (shipped.length > 0 ? ` and the assets/lang of ${shipped.join(", ")}` : ""),
      purpose:
        `the typed translation keys of ${ir.package} and of the packages it declares (\`I18n.<namespace>.<path>\` ` +
        'is `"<namespace>::<path>"`), its locales, and the lazy catalogue loaders `loadMessages` merges along a ' +
        "locale's fallback chain.",
      boundary:
        "reached as `#stackra/i18n`; a key is a branded string, never a raw one. Add a key to the base locale's JSON " +
        "and run `stackra gen`.",
      runtime: "isomorphic",
    }),
    'import { keys, loadMessages as load } from "@stackra/i18n";',
    "",
    "/** Every translation key of the member and its declared packages, by namespace. */",
    `export const I18n = keys(${JSON.stringify(tree, null, 2)});`,
    "",
    "/** The locales the member ships catalogues for. */",
    `export const locales = ${JSON.stringify(locales)} as const;`,
    "",
    "/** One lazy loader per namespace and locale file: the member's lang and its declared packages'. */",
    "export const catalogues = {",
    ...[...loaderSpecifiers(ir)].flatMap(([namespace, byLocale]) => [
      `  ${JSON.stringify(namespace)}: {`,
      ...[...byLocale].map(
        ([locale, specifier]) =>
          `    ${JSON.stringify(locale)}: () => import(${JSON.stringify(specifier)}, { with: { type: "json" } }),`,
      ),
      "  },",
    ]),
    "};",
    "",
    "/** The merged messages of `locale` by namespace, along its fallback chain (`ar-SA`, `ar`, `en`). */",
    "export const loadMessages = (locale: string) => load(catalogues, locale);",
    "",
  ].join("\n");
  return { path: ".stackra/gen/i18n.ts", content };
}
