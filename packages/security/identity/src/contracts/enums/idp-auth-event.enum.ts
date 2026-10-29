/**
 * Stackra file contract:
 * Purpose: `IdpAuthEvent`, the identity provider's authentication events the audit chain keeps: a sign-in that passed
 *          or failed, a second factor that passed or failed, a lockout, and a session that ended.
 * Boundary: an `Enum.of` value plus the type of the same name, provider-neutral snake_case codes; the ZITADEL ingest
 *           maps the provider's event types to them (`ZITADEL_AUTH_EVENTS`). The code is the audit key's verb
 *           (`identity.idp_auth_event.<code>@1`) and, for a failure or a lockout, the refusal code.
 * Runtime: isomorphic
 * Governing contract: ADR 0212 (decision 3: the audit chain); ADR 0231 (snake_case codes); STA-1579.
 */
import { Enum } from "@stackra/contracts";

/** The authentication events written to the audit chain. */
export const IdpAuthEvent = Enum.of({
  /** A first factor (password, passkey or an external provider) was accepted. */
  SignInSucceeded: "sign_in_succeeded",
  /** A first factor was refused. */
  SignInFailed: "sign_in_failed",
  /** A second factor (authenticator code, security key, code by email or SMS) was accepted. */
  SecondFactorSucceeded: "second_factor_succeeded",
  /** A second factor was refused. */
  SecondFactorFailed: "second_factor_failed",
  /** The user was locked, by the lockout policy or by an administrator. */
  Locked: "locked",
  /** A session ended: the user signed out or the session was terminated. */
  SessionEnded: "session_ended",
});

/** One of the codes above. */
export type IdpAuthEvent = Enum.Value<typeof IdpAuthEvent>;
