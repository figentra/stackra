/**
 * Stackra file contract:
 * Purpose: `emitI18n`, the i18n target: `.stackra/gen/i18n.ts`, reached as `#stackra/i18n`, with `I18n`, the typed key
 *          tree of the member's lang catalogues and of the namespaces its declared `@stackra/*` packages ship
 *          (`I18n.carts.nav.sales` is `"carts::nav.sales"`, `I18n.loyalty_kit.enums.loyalty_tier.gold` comes from
 *          `@stackra/loyalty-kit`; built by `keys(...)` of `@stackra/i18n`), and `locales`, the locale folders under
 *          the member's `assets/lang`.
 * Boundary: pure. The tree is `i18nTree(ir)` (each catalogue set's base locale; `$` notes left out); a namespace clash
 *           is refused by `checkI18n` before this runs. Nothing is written for a member with no namespace at all, or
 *           one that does not declare `@stackra/i18n` (the import would not resolve).
 * Runtime: isomorphic
 * Governing contract: ADR 0268 (R15: typed keys); ADR 0231 (`<module>::<path>` lookups); registry v3.1 section 5
 *                     item 7 (`#stackra/i18n`); STA-1293; STA-1298 (package namespaces merged).
 */
import { generatedHeader } from "#core/functions/generated-header.function";
import { i18nTree } from "#core/functions/i18n-tree.function";
import type { GeneratedFile } from "#core/types/generated-file.type";
import type { MemberIR } from "#core/types/member-ir.type";

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
        'is `"<namespace>::<path>"`) and its locales.',
      boundary:
        "reached as `#stackra/i18n`; a key is a branded string, never a raw one. Add a key to the base locale's JSON " +
        "and run `stackra gen`.",
      runtime: "isomorphic",
    }),
    'import { keys } from "@stackra/i18n";',
    "",
    "/** Every translation key of the member and its declared packages, by namespace. */",
    `export const I18n = keys(${JSON.stringify(tree, null, 2)});`,
    "",
    "/** The locales the member ships catalogues for. */",
    `export const locales = ${JSON.stringify(locales)} as const;`,
    "",
  ].join("\n");
  return { path: ".stackra/gen/i18n.ts", content };
}
