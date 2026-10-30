/**
 * Stackra file contract:
 * Purpose: `mobileIdsOf(product, app, identity)`, a mobile app's store ids: the ids its runway `identity` sets, else
 *          `com.figentra.<product>.<app>` (without `<app>` when it repeats `<product>`), with `-` turned into `_` in
 *          the Android package, which forbids it.
 * Boundary: pure; a set id is answered unchanged, since an id is frozen at the first store upload.
 * Runtime: isomorphic
 * Governing contract: ADR 0439 (decision 6), ADR 0482 (decision 2).
 */
import type { MobileIds } from "#core/types/mobile-ids.type";

/** The identity fields the ids come from. */
type IdentityIds = {
  readonly ios?: { readonly bundleId?: string | undefined } | undefined;
  readonly android?: { readonly package?: string | undefined } | undefined;
};

/**
 * The store ids of app `app` of product `product`.
 *
 * @example
 * mobileIdsOf("commerce", "staff", {}); // { bundleId: "com.figentra.commerce.staff", packageName: "com.figentra.commerce.staff" }
 * mobileIdsOf("academorix", "academorix", {}); // bundleId "com.figentra.academorix"
 */
export function mobileIdsOf(product: string, app: string, identity: IdentityIds = {}): MobileIds {
  const derived = ["com", "figentra", product, ...(app === product ? [] : [app])].join(".");
  return {
    bundleId: identity.ios?.bundleId ?? derived,
    packageName: identity.android?.package ?? derived.replaceAll("-", "_"),
  };
}
