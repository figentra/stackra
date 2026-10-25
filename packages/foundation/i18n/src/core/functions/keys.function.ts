/**
 * Stackra file contract:
 * Purpose: `keys(tree)`, the typed key builder gen calls in `#stackra/i18n`: it turns a tree of namespaces, branches
 *          and leaf names into the same tree whose leaves are branded `I18nKey`s (`I18n.web.nav.home` is
 *          `"web::nav.home"`).
 * Boundary: pure; builds frozen objects and reads no catalogue (gen checks every key exists in every base locale).
 *           The first level is the namespace, so the key is `<namespace>::<path>`; a `_` list holds the leaves of a
 *           branch that also has children. A leaf that collides with a child branch is refused.
 * Runtime: isomorphic
 * Governing contract: ADR 0268 (R15: typed keys), ADR 0231 (`<module>::<path>`), ADR 0294 (decision 20: derived keys
 *                     under their kind segment); registry v3.1 section 5 item 7.
 */
import type { KeyNode } from "#core/types/key-node.type";
import type { KeysOf } from "#core/types/keys-of.type";

/** The branch's leaves and children as one frozen object of keys under `prefix` (`web::` or `web::nav.`). */
function build(node: KeyNode, prefix: string): object {
  const out: Record<string, unknown> = {};
  const put = (name: string, value: unknown) => {
    if (name in out) throw new RangeError(`i18n key "${prefix}${name}" is declared twice`);
    out[name] = value;
  };
  if (Array.isArray(node)) {
    for (const leaf of node as readonly string[]) put(leaf, prefix + leaf);
    return Object.freeze(out);
  }
  for (const [segment, child] of Object.entries(node as Record<string, KeyNode>)) {
    if (segment === "_") for (const leaf of child as readonly string[]) put(leaf, prefix + leaf);
    else put(segment, build(child, `${prefix}${segment}.`));
  }
  return Object.freeze(out);
}

/**
 * The typed key tree of `tree`.
 *
 * @param tree - namespace to branch; every leaf name is a path segment.
 * @throws RangeError when a name appears twice in one branch (a `_` leaf and a child branch of the same name).
 * @example
 * export const I18n = keys({
 *   web: { nav: ["home", "pricing"], features: { _: ["title"], catalogue: ["title", "body"] } },
 * });
 * I18n.web.nav.home; // "web::nav.home"
 * I18n.web.features.title; // "web::features.title"
 * I18n.web.features.catalogue.body; // "web::features.catalogue.body"
 */
export function keys<const T extends { readonly [namespace: string]: KeyNode }>(
  tree: T,
): KeysOf<T> {
  const out: Record<string, unknown> = {};
  for (const [namespace, node] of Object.entries(tree))
    out[namespace] = build(node, `${namespace}::`);
  return Object.freeze(out) as KeysOf<T>;
}
