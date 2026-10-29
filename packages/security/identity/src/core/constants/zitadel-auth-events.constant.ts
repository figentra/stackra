/**
 * Stackra file contract:
 * Purpose: `ZITADEL_AUTH_EVENTS`, the ZITADEL event types the auth-event ingest records, each with the `IdpAuthEvent`
 *          it becomes. Also the list to subscribe the ZITADEL Actions v2 event execution to.
 * Boundary: data only. An event type not listed here is acknowledged and not recorded. The names are ZITADEL's
 *           eventstore types (v2.x); a renamed type upstream needs a new row here.
 * Runtime: isomorphic
 * Governing contract: ADR 0212 (decision 3); ADR 0206 (ZITADEL is the identity provider); STA-1579.
 */
import { IdpAuthEvent } from "#contracts/enums/idp-auth-event.enum";

/** ZITADEL event type to the audit event it records. */
export const ZITADEL_AUTH_EVENTS: Readonly<Record<string, IdpAuthEvent>> = Object.freeze({
  "user.human.password.check.succeeded": IdpAuthEvent.SignInSucceeded,
  "user.human.password.check.failed": IdpAuthEvent.SignInFailed,
  "user.human.passwordless.token.check.succeeded": IdpAuthEvent.SignInSucceeded,
  "user.human.passwordless.token.check.failed": IdpAuthEvent.SignInFailed,
  "user.human.externallogin.check.succeeded": IdpAuthEvent.SignInSucceeded,
  "user.human.mfa.otp.check.succeeded": IdpAuthEvent.SecondFactorSucceeded,
  "user.human.mfa.otp.check.failed": IdpAuthEvent.SecondFactorFailed,
  "user.human.u2f.token.check.succeeded": IdpAuthEvent.SecondFactorSucceeded,
  "user.human.u2f.token.check.failed": IdpAuthEvent.SecondFactorFailed,
  "user.human.otp.sms.check.succeeded": IdpAuthEvent.SecondFactorSucceeded,
  "user.human.otp.sms.check.failed": IdpAuthEvent.SecondFactorFailed,
  "user.human.otp.email.check.succeeded": IdpAuthEvent.SecondFactorSucceeded,
  "user.human.otp.email.check.failed": IdpAuthEvent.SecondFactorFailed,
  "user.locked": IdpAuthEvent.Locked,
  "user.human.signed.out": IdpAuthEvent.SessionEnded,
  "session.terminated": IdpAuthEvent.SessionEnded,
});
