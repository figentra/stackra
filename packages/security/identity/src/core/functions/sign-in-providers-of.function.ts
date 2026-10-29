/**
 * Stackra file contract:
 * Purpose: `signInProvidersOf`, the external sign-in providers a market offers on a date (a national ID service, a
 *          national digital ID), read from the market pack under `IdentityConfig.signInProvidersKey` and kept only when
 *          this deployment has the provider configured, then every configured `SocialProvider` (Apple) the pack did
 *          not list.
 * Boundary: pure; which providers a market offers is pack data and which are wired is configuration, so no country is
 *           named here. A pack value that is not a list of keys counts as none; a social provider is offered in every
 *           market only once configured.
 * Runtime: isomorphic
 * Governing contract: owner round 3 #21 (national IdPs as external identity providers); ADR 0370; ADR 0363;
 *                     STA-1578 (App Store guideline 4.8: Apple beside every social sign-in).
 */
import { Enum } from "@stackra/contracts";
import { type ResolvedPack, valueOf } from "@stackra/market-packs";

import type { IdentityConfig } from "#config/identity.config";
import { SocialProvider } from "#core/enums/social-provider.enum";

/**
 * The provider keys `resolved` offers on `on`, in the pack's order, then the configured social providers.
 *
 * @example
 * signInProvidersOf(await packs.resolve("sa"), today, identity); // ["nafath", "apple"]
 */
export function signInProvidersOf(
  resolved: ResolvedPack,
  on: string,
  config: Pick<IdentityConfig, "signInProvidersKey" | "externalProviders">,
): readonly string[] {
  const value = valueOf(resolved, config.signInProvidersKey, on)?.value;
  const listed: unknown[] = Array.isArray(value) ? value : [];
  const market = listed.filter(
    (key): key is string => typeof key === "string" && Object.hasOwn(config.externalProviders, key),
  );
  const social = Enum.values(SocialProvider).filter(
    (key) => Object.hasOwn(config.externalProviders, key) && !market.includes(key),
  );
  return [...market, ...social];
}
