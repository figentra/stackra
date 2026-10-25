/**
 * Stackra file contract:
 * Purpose: `signInProvidersOf`, the external sign-in providers a market offers on a date (a national ID service, a
 *          national digital ID), read from the market pack under `IdentityConfig.signInProvidersKey` and kept only when
 *          this deployment has the provider configured.
 * Boundary: pure; which providers a market offers is pack data and which are wired is configuration, so no country or
 *           provider is named here. A pack value that is not a list of keys counts as none.
 * Runtime: isomorphic
 * Governing contract: owner round 3 #21 (national IdPs as external identity providers); ADR 0370; ADR 0363.
 */
import { type ResolvedPack, valueOf } from "@stackra/market-packs";

import type { IdentityConfig } from "#config/identity.config";

/**
 * The provider keys `resolved` offers on `on`, in the pack's order.
 *
 * @example
 * signInProvidersOf(await packs.resolve("sa"), today, identity); // ["nafath"]
 */
export function signInProvidersOf(
  resolved: ResolvedPack,
  on: string,
  config: Pick<IdentityConfig, "signInProvidersKey" | "externalProviders">,
): readonly string[] {
  const listed = valueOf(resolved, config.signInProvidersKey, on)?.value;
  if (!Array.isArray(listed)) return [];
  return listed.filter(
    (key): key is string => typeof key === "string" && Object.hasOwn(config.externalProviders, key),
  );
}
