/**
 * Stackra file contract:
 * Purpose: `flagRefs(tree)`, which builds the typed flag references of the generated `#stackra/flags`
 *          (`Flags.web.help_centre`) from module and flag names: a declared flag class, or a flag of a consumed
 *          manifest written out as data.
 * Boundary: derives a declared flag's key (`<module>.<name>`) and label key (`<module>::flags.<name>.label`) from the
 *           tree names gen wrote, and reads its options from the kind registry. Returns frozen objects. It holds no
 *           value and checks no expiry: gen does that at build time.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 20: derived keys and labels); ADR 0307 (decision 25); registry v3.1
 *                     section 5 (gen emits `flags`).
 */
import { kindOf } from "@stackra/container";

import { DEFAULT_FLAG_SCOPES } from "#core/constants/default-flag-scopes.constant";
import type { FlagClass } from "#core/types/flag-class.type";
import type { FlagRef } from "#core/types/flag-ref.type";
import type { FlagRefInput } from "#core/types/flag-ref-input.type";
import type { FlagRefs } from "#core/types/flag-refs.type";

/**
 * The reference of the flag `name` in `module`.
 *
 * @throws TypeError when a function in the tree is not a class declared with `extends Flag({...})`.
 */
function refOf(module: string, name: string, flag: FlagClass | FlagRefInput): FlagRef {
  const label = `${module}::flags.${name}.label`;
  if (typeof flag !== "function")
    return Object.freeze({
      scopes: DEFAULT_FLAG_SCOPES,
      expires: null,
      removalIssue: null,
      label,
      ...flag,
    });
  const record = kindOf(flag);
  if (record?.kind !== "flag" || typeof record.options.default !== "boolean")
    throw new TypeError(
      `${module}.${name} is not a flag: declare ${flag.name} with extends Flag({ default })`,
    );
  return Object.freeze({
    ...(record.options as Omit<FlagRef, "key" | "label">),
    key: `${module}.${name}`,
    label,
  });
}

/**
 * Typed references to flags, by module and name.
 *
 * @throws TypeError when a function in the tree is not a flag class.
 * @example
 * export const Flags = flagRefs({
 *   web: { pricing_yearly_first: PricingYearlyFirstFlag, help_centre: HelpCentreFlag },
 *   orders: { quick_order: { key: "orders.quick_order", default: true } },
 * });
 * Flags.web.help_centre.key; // "web.help_centre"
 */
export function flagRefs<
  const T extends Readonly<Record<string, Readonly<Record<string, FlagClass | FlagRefInput>>>>,
>(tree: T): FlagRefs<T> {
  const refs: Record<string, Readonly<Record<string, FlagRef>>> = {};
  for (const [module, flags] of Object.entries(tree)) {
    const group: Record<string, FlagRef> = {};
    for (const [name, flag] of Object.entries(flags)) group[name] = refOf(module, name, flag);
    refs[module] = Object.freeze(group);
  }
  return Object.freeze(refs) as FlagRefs<T>;
}
