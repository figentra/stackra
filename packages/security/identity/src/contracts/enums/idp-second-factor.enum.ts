/**
 * Stackra file contract:
 * Purpose: `IdpSecondFactor`, the second factors an organisation's login policy can offer: an authenticator app code,
 *          a hardware security key, a code by email or by SMS.
 * Boundary: an `Enum.of` value plus the type of the same name, provider-neutral snake_case codes; the ZITADEL driver
 *           maps each to its `SECOND_FACTOR_TYPE_*`. Which factors a market or tenant offers is market-pack and
 *           settings data, never code.
 * Runtime: isomorphic
 * Governing contract: ADR 0207 (decision 1); ADR 0231 (snake_case codes); ADR 0410; STA-1263.
 */
import { Enum } from "@stackra/contracts";

/** The second factors a login policy may offer. */
export const IdpSecondFactor = Enum.of({
  /** A time-based code from an authenticator app (RFC 6238). */
  Totp: "totp",
  /** A hardware security key (U2F / WebAuthn). */
  U2f: "u2f",
  /** A one-time code sent by email. */
  OtpEmail: "otp_email",
  /** A one-time code sent by SMS. */
  OtpSms: "otp_sms",
});

/** One of the codes above. */
export type IdpSecondFactor = Enum.Value<typeof IdpSecondFactor>;
