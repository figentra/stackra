/**
 * Stackra file contract:
 * Purpose: `emitI18n`, the i18n target: `.stackra/gen/i18n.ts`, reached as `#stackra/i18n`, with `I18n`, the typed key
 *          tree of the member's lang catalogues (`I18n.carts.nav.sales` is `"carts::nav.sales"`, built by `keys(...)` of
 *          `@stackra/i18n`), and `locales`, the locale folders under `assets/lang`.
 * Boundary: pure. The keys come from the base locale (`en` when present, else the first locale by name); every
 *           namespace is a file name, every nested object a branch, every other value a leaf; a `$`-prefixed name (`$comment`) is a note, not a key. Nothing is written for a
 *           member without catalogues, or one that does not declare `@stackra/i18n` (the import would not resolve).
 * Runtime: isomorphic
 * Governing contract: ADR 0268 (R15: typed keys); ADR 0231 (`<module>::<path>` lookups); registry v3.1 section 5
 *                     item 7 (`#stackra/i18n`); STA-1293.
 */
import { generatedHeader } from "#core/functions/generated-header.function";
import type { GeneratedFile } from "#core/types/generated-file.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** The `KeyNode` of one catalogue branch: a leaf list, or children by segment with the leaves under `_`. */
function nodeOf(branch: Readonly<Record<string, unknown>>): unknown {
  const leaves: string[] = [];
  const children: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(branch)) {
    if (name.startsWith("$")) continue; // `$comment` and other notes for translators are not keys
    if (typeof value === "object" && value !== null && !Array.isArray(value))
      children[name] = nodeOf(value as Record<string, unknown>);
    else leaves.push(name);
  }
  if (Object.keys(children).length === 0) return leaves;
  return leaves.length > 0 ? { _: leaves, ...children } : children;
}

/**
 * The `#stackra/i18n` file of `ir`, or undefined when it has no catalogues or does not declare `@stackra/i18n`.
 *
 * @param ir - the member read by discovery, with its `catalogues`.
 * @example
 * emitI18n(ir)?.path; // ".stackra/gen/i18n.ts"
 */
export function emitI18n(ir: MemberIR): GeneratedFile | undefined {
  const locales = Object.keys(ir.catalogues ?? {}).sort();
  if (locales.length === 0) return undefined;
  if (ir.packages !== undefined && !ir.packages.includes("@stackra/i18n")) return undefined;
  const base = locales.includes("en") ? "en" : (locales[0] ?? "en");
  const catalogues = ir.catalogues?.[base] ?? {};
  const tree = Object.fromEntries(
    Object.keys(catalogues)
      .sort()
      .map((namespace) => {
        const catalogue = catalogues[namespace];
        return [
          namespace,
          typeof catalogue === "object" && catalogue !== null && !Array.isArray(catalogue)
            ? nodeOf(catalogue as Record<string, unknown>)
            : [],
        ];
      }),
  );
  const content = [
    generatedHeader({
      from: `assets/lang/<locale>/*.json (keys from ${base})`,
      purpose:
        `the typed translation keys of ${ir.package} (\`I18n.<namespace>.<path>\` is \`"<namespace>::<path>"\`) and ` +
        "its locales.",
      boundary:
        "reached as `#stackra/i18n`; a key is a branded string, never a raw one. Add a key to the base locale's JSON " +
        "and run `stackra gen`.",
      runtime: "isomorphic",
    }),
    'import { keys } from "@stackra/i18n";',
    "",
    "/** Every translation key of the member, by namespace. */",
    `export const I18n = keys(${JSON.stringify(tree, null, 2)});`,
    "",
    "/** The locales the member ships catalogues for. */",
    `export const locales = ${JSON.stringify(locales)} as const;`,
    "",
  ].join("\n");
  return { path: ".stackra/gen/i18n.ts", content };
}
