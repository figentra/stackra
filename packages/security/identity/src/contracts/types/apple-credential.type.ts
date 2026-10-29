/**
 * Stackra file contract:
 * Purpose: `AppleCredential`, what Sign in with Apple hands back on the device: Apple's identity token and
 *          authorization code for the server to check and exchange, Apple's stable user id, and the email and name
 *          Apple shares on the first sign-in only.
 * Boundary: a type only. The token is checked on the server (signature, audience, the nonce it was asked for), never
 *           trusted on the device. Personal data: the email and name, passed straight to the server.
 * Runtime: isomorphic
 * Governing contract: ADR 0206 (decision 8); STA-1578 (App Store guideline 4.8).
 */

/** An Apple credential from the device. */
export type AppleCredential = {
  /** Apple's identity token (a JWT) carrying the nonce the server asked for. */
  readonly identityToken: string;
  /** The one-time authorization code, or `null` when Apple sent none. */
  readonly authorizationCode: string | null;
  /** Apple's stable user id for this team. */
  readonly user: string;
  /** The email Apple shares (perhaps a private relay), first sign-in only; else `null`. */
  readonly email: string | null;
  /** The person's name as one string, first sign-in only; else `null`. */
  readonly name: string | null;
};
