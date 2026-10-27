/**
 * Stackra file contract:
 * Purpose: `SignedTokenCheck`, the outcome of `signedToken.verify`: the signed data, or the one reason the token is
 *          refused.
 * Boundary: a type only. The reason is for logs and metrics; a caller shows a user one generic refusal.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); STA-934.
 */

/** A verified token, or why it was refused. */
export type SignedTokenCheck =
  | {
      readonly ok: true;
      /** The data signed into the token. */
      readonly data: unknown;
      /** The id of the key that signed it. */
      readonly keyId: string;
      /** When it stops being valid. */
      readonly expiresAt: Date;
    }
  | {
      readonly ok: false;
      readonly reason: "malformed" | "unknown_key" | "bad_signature" | "wrong_purpose" | "expired";
    };
