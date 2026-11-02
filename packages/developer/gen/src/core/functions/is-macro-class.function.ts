/**
 * Stackra file contract:
 * Purpose: `isMacroClass(value)`, whether an exported value is a migration macro class: its prototype chain reaches the
 *          `Macro` kind base of `@stackra/database`, and it implements `apply`.
 * Boundary: pure and structural, never `instanceof`: a store with several peer-variant copies of `@stackra/database`
 *           gives a package's macros another copy's `Macro` than the one gen loads, and `instanceof` dropped them
 *           (STA-2006). `Macro` is a reserved kind-base name (`kind_base_name_reserved`), so no member class takes it;
 *           its `apply` is abstract, so the class itself must carry one.
 * Runtime: isomorphic
 * Governing contract: ADR 0159 (macros of a migration); ADR 0305 (kind-base names are reserved); STA-2006.
 */

/**
 * Whether `value` is a macro class, from whichever copy of `@stackra/database` it extends.
 *
 * @example
 * isMacroClass(DataClassificationMacro); // true
 * isMacroClass(CreateOrdersMigration); // false
 */
export function isMacroClass(value: unknown): boolean {
  if (typeof value !== "function") return false;
  if (typeof (value as { prototype?: { apply?: unknown } }).prototype?.apply !== "function")
    return false;
  for (
    let base: unknown = Object.getPrototypeOf(value);
    typeof base === "function" && base !== Function.prototype;
    base = Object.getPrototypeOf(base)
  )
    if (base.name === "Macro") return true;
  return false;
}
