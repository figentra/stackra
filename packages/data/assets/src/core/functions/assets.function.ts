/**
 * Stackra file contract:
 * Purpose: `assets(tree)`, which builds the typed constants of the generated `#stackra/assets`
 *          (`Assets.console.public.logo_svg`) from the module, kind and leaf names gen wrote, keeping each key's
 *          literal type for `useAsset` and `AssetLibrary`.
 * Boundary: checks that every key parses and sits under its own module and kind in the tree, that every source file
 *           is a relative path, that `overridable` is a boolean, and that a data asset's hash is a
 *           SHA-256 hex digest and its version is not blank; returns frozen copies. It resolves no URL and
 *           reads no file. Overrides are settled by gen before this runs (ADR 0306): `file` names the winner.
 * Runtime: isomorphic
 * Governing contract: ADR 0234 (decisions 2, 4 and 5); ADR 0306 (rules 1, 2 and 11); ADR 0261; registry v3.1
 *                     section 5 (gen emits `assets`).
 */
import { isRelativePath } from "#core/functions/is-relative-path.function";
import { parseAssetKey } from "#core/functions/parse-asset-key.function";
import type { AssetEntry } from "#core/types/asset-entry.type";
import type { AssetTree } from "#core/types/asset-tree.type";

/** A lowercase SHA-256 hex digest. */
const SHA256 = /^[0-9a-f]{64}$/;

/**
 * A frozen copy of the entry at `module.kind.name`.
 *
 * @throws TypeError when the entry does not belong where the tree puts it, or is malformed.
 */
function entryOf(module: string, kind: string, name: string, entry: AssetEntry): AssetEntry {
  const where = `${module}.${kind}.${name}`;
  const parts = parseAssetKey(entry.key);
  if (parts.module !== module || parts.kind !== kind)
    throw new TypeError(
      `${where} holds "${entry.key}": its key must start with "${module}::${kind}/"`,
    );
  if (!isRelativePath(entry.file))
    throw new TypeError(
      `${where} has the file "${entry.file}": write a path relative to the member root`,
    );
  if (typeof entry.overridable !== "boolean")
    throw new TypeError(`${where} must say whether it is overridable (true or false)`);
  if (entry.hash !== undefined && !SHA256.test(entry.hash))
    throw new TypeError(
      `${where} has the hash "${entry.hash}": write a lowercase SHA-256 hex digest`,
    );
  if (entry.version !== undefined && entry.version.trim() === "")
    throw new TypeError(`${where} has a blank version`);
  return Object.freeze({
    key: entry.key,
    file: entry.file,
    overridable: entry.overridable,
    ...(entry.hash === undefined ? {} : { hash: entry.hash }),
    ...(entry.version === undefined ? {} : { version: entry.version }),
  });
}

/**
 * Typed asset constants, by module, kind folder and leaf name.
 *
 * @throws TypeError when an entry's key is malformed or names another module or kind, its file is not relative, or
 *         `overridable` is not a boolean.
 * @example
 * export const Assets = assets({
 *   orders: {
 *     public: {
 *       logo_svg: { key: "orders::public/logo.svg", file: "assets/public/orders/logo.svg", overridable: true },
 *     },
 *   },
 * });
 * Assets.orders.public.logo_svg.key; // "orders::public/logo.svg"
 */
export function assets<const T extends AssetTree>(tree: T): T {
  const built: Record<string, Readonly<Record<string, Readonly<Record<string, AssetEntry>>>>> = {};
  for (const [module, kinds] of Object.entries(tree)) {
    const group: Record<string, Readonly<Record<string, AssetEntry>>> = {};
    for (const [kind, files] of Object.entries(kinds)) {
      const leaves: Record<string, AssetEntry> = {};
      for (const [name, entry] of Object.entries(files))
        leaves[name] = entryOf(module, kind, name, entry);
      group[kind] = Object.freeze(leaves);
    }
    built[module] = Object.freeze(group);
  }
  return Object.freeze(built) as T;
}
