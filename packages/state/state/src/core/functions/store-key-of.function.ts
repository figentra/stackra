/**
 * Stackra file contract:
 * Purpose: `storeKeyOf`, the derived key a store class's persisted state is stored under (`console.ui`), read from the
 *          registry `registerStores` fills; a subclass reads its nearest registered ancestor's key.
 * Boundary: internal; reads `STORE_KEYS` only. The key needs the member, which a class cannot see, so gen writes it
 *           (ADR 0294 decision 20); an unregistered persisted store throws instead of guessing a key, because state
 *           written under a guessed key is lost once the real key is registered.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 20 and 22).
 */
import { STORE_KEYS } from "#core/constants/store-keys.constant";

/**
 * The registered key of `type`.
 *
 * @throws TypeError when neither `type` nor an ancestor is registered.
 */
export function storeKeyOf(type: object): string {
  for (
    let current: object | null = type;
    current !== null && current !== Function.prototype;
    current = Object.getPrototypeOf(current) as object | null
  ) {
    const key = STORE_KEYS.get(current);
    if (key !== undefined) return key;
  }
  const name = (type as { readonly name?: string }).name || "This store";
  throw new TypeError(
    `${name} persists but has no registered key: run \`stackra gen\` and load its member's generated ` +
      `#stackra/wiring, or call registerStores([[${name}, "<member>.<name>"]]) in a test`,
  );
}
