/**
 * Stackra file contract:
 * Purpose: `SocialProvider`, the external sign-in providers that are not tied to a market: Sign in with Apple.
 * Boundary: an `Enum.of` value plus the type of the same name. A key here is offered in every market once this
 *           deployment configures it (`IdentityConfig.externalProviders.<key>`, the ZITADEL provider's id), because
 *           App Store guideline 4.8 asks for Apple wherever another social sign-in is offered; market providers (a
 *           national ID service) stay market pack data. Whether a key is on is configuration, never this list.
 * Runtime: isomorphic
 * Governing contract: owner round 3 #21; ADR 0370; STA-1578 (App Store guideline 4.8).
 */
import { Enum } from "@stackra/contracts";

/** The provider keys offered in every market once configured. */
export const SocialProvider = Enum.of({
  /** Sign in with Apple, through ZITADEL's Apple provider. */
  Apple: "apple",
});

/** One of the keys above. */
export type SocialProvider = Enum.Value<typeof SocialProvider>;
