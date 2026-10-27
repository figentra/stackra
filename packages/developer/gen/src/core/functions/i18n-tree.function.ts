/**
 * Stackra file contract:
 * Purpose: `i18nTree`, the merged key tree behind `#stackra/i18n`: the member's own namespaces from its base locale,
 *          then every namespace its declared `@stackra/*` packages ship (`loyalty_kit` of `@stackra/loyalty-kit`),
 *          each with where it comes from; plus the namespaces claimed twice (STA-1298).
 * Boundary: pure. A catalogue set's base locale is `en` when present, else the first locale by name; every namespace
 *           is a file name, every nested object a branch, every other value a leaf; a `$`-prefixed name (`$comment`)
 *           is a note, not a key. On a clash the first owner keeps the namespace (the member, then package.json
 *           order); `checkI18n` refuses the clash, so a clashing tree is never written.
 * Runtime: isomorphic
 * Governing contract: ADR 0268 (R15: typed keys); ADR 0231 (`<module>::<path>` lookups); STA-1293; STA-1298.
 */
import type { I18nNamespace } from "#core/types/i18n-namespace.type";
import type { I18nNode } from "#core/types/i18n-node.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** The `I18nNode` of one catalogue branch. */
function nodeOf(branch: Readonly<Record<string, unknown>>): I18nNode {
  const leaves: string[] = [];
  const children: Record<string, I18nNode> = {};
  for (const [name, value] of Object.entries(branch)) {
    if (name.startsWith("$")) continue; // `$comment` and other notes for translators are not keys
    if (typeof value === "object" && value !== null && !Array.isArray(value))
      children[name] = nodeOf(value as Record<string, unknown>);
    else leaves.push(name);
  }
  if (Object.keys(children).length === 0) return leaves;
  return leaves.length > 0 ? { _: leaves, ...children } : children;
}

/** The base locale of a catalogue set. */
function baseOf(catalogues: NonNullable<MemberIR["catalogues"]>): string {
  const locales = Object.keys(catalogues).sort();
  return locales.includes("en") ? "en" : (locales[0] ?? "en");
}

/**
 * The merged namespaces of `ir` by name, sorted, and every namespace claimed by more than one owner.
 *
 * @param ir - the member read by discovery, with its `catalogues` and `packageCatalogues`.
 * @example
 * i18nTree(ir).namespaces.get("loyalty_kit")?.package; // "@stackra/loyalty-kit"
 */
export function i18nTree(ir: MemberIR): {
  readonly namespaces: ReadonlyMap<string, I18nNamespace>;
  readonly clashes: readonly { readonly namespace: string; readonly owners: readonly string[] }[];
} {
  const sets = [
    ...(ir.catalogues !== undefined ? [{ owner: undefined, catalogues: ir.catalogues }] : []),
    ...(ir.packageCatalogues ?? []).map((shipped) => ({
      owner: shipped.package,
      catalogues: shipped.catalogues,
    })),
  ];
  const namespaces = new Map<string, I18nNamespace>();
  const owners = new Map<string, string[]>();
  for (const { owner, catalogues } of sets) {
    const base = baseOf(catalogues);
    for (const [namespace, catalogue] of Object.entries(catalogues[base] ?? {})) {
      owners.set(namespace, [...(owners.get(namespace) ?? []), owner ?? ir.package]);
      if (namespaces.has(namespace)) continue;
      const node =
        typeof catalogue === "object" && catalogue !== null && !Array.isArray(catalogue)
          ? nodeOf(catalogue as Record<string, unknown>)
          : [];
      namespaces.set(namespace, { node, base, ...(owner !== undefined ? { package: owner } : {}) });
    }
  }
  return {
    namespaces: new Map([...namespaces].sort(([left], [right]) => left.localeCompare(right))),
    clashes: [...owners]
      .filter(([, claimed]) => claimed.length > 1)
      .map(([namespace, claimed]) => ({ namespace, owners: claimed }))
      .sort((left, right) => left.namespace.localeCompare(right.namespace)),
  };
}
