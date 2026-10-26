/**
 * Stackra file contract:
 * Purpose: `LoginPolicy`, an organisation's sign-in rules as `IdpAdmin.setLoginPolicy` sets them: which methods are
 *          allowed, whether self-registration is open, whether every user must use a second factor, and what the login
 *          page reveals; optionally the exact external providers (national IDs and others, by the provider's id) and
 *          second factors the organisation's login page offers.
 * Boundary: a type only. The values are tenant settings and market-pack defaults (a regulated market forces MFA), never
 *           code: the caller reads them from settings and pushes them here when they change.
 * Runtime: isomorphic
 * Governing contract: ADR 0206; ADR 0207 (decision 1: step-up); ADR 0410 (STA-834); STA-1263 (providers and second factors per market pack).
 */

import type { IdpSecondFactor } from "#contracts/enums/idp-second-factor.enum";

/** One organisation's login policy. */
export interface LoginPolicy {
  /** Users may sign in with a username and password. */
  readonly allowUsernamePassword: boolean;

  /** People may register themselves. */
  readonly allowRegister: boolean;

  /** Users may sign in through an external identity provider. */
  readonly allowExternalIdp: boolean;

  /** Every user must set up and use a second factor. */
  readonly forceMfa: boolean;

  /** Users may sign in with a passkey alone. */
  readonly allowPasswordless: boolean;

  /** The login page hides "forgot password". */
  readonly hidePasswordReset: boolean;

  /** The login page does not say whether a username exists. */
  readonly ignoreUnknownUsernames: boolean;

  /**
   * The provider-side ids of the external identity providers the login page offers (the market pack's sign-in
   * providers through `IdentityConfig.externalProviders`), exactly: others are removed. Absent leaves them as they are.
   */
  readonly externalProviderIds?: readonly string[];

  /** The second factors the organisation offers, exactly: others are removed. Absent leaves them as they are. */
  readonly secondFactors?: readonly IdpSecondFactor[];
}
