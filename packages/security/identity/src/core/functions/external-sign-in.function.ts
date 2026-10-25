/**
 * Stackra file contract:
 * Purpose: `externalSignIn`, the sign-in options that send the hosted sign-in straight to one external identity
 *          provider: the configured hint scope with the provider's id at this deployment.
 * Boundary: pure; the provider's id and the scope template are configuration. A provider this deployment does not
 *           configure is a caller bug (it was not in `signInProvidersOf`), refused with a `RangeError`.
 * Runtime: isomorphic
 * Governing contract: owner round 3 #21; ADR 0206 (decisions 2 and 8).
 */
import type { SignInOptions } from "#contracts/index";
import type { IdentityConfig } from "#config/identity.config";

/**
 * The options of a sign-in through `provider`.
 *
 * @throws RangeError when `provider` is not configured.
 * @example
 * await session.signIn(externalSignIn("nafath", identity));
 */
export function externalSignIn(
  provider: string,
  config: Pick<IdentityConfig, "externalProviders" | "externalProviderScope">,
): SignInOptions {
  const id = Object.hasOwn(config.externalProviders, provider)
    ? config.externalProviders[provider]
    : undefined;
  if (id === undefined) throw new RangeError(`no external provider "${provider}" is configured`);
  return { scopes: [config.externalProviderScope.replaceAll("{id}", id)] };
}
