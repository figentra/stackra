/**
 * Stackra file contract:
 * Purpose: `AppleSignInRefusal`, why the device did not hand back an Apple credential: Sign in with Apple cannot be
 *          used here, the person closed the sheet, or the request failed.
 * Boundary: an `Enum.of` value plus the type of the same name, provider-neutral snake_case codes; an `AppleSignIn`
 *           driver maps its library's errors to them. A refusal is a value the caller branches on, never a thrown
 *           error.
 * Runtime: isomorphic
 * Governing contract: ADR 0206 (decision 8); ADR 0231 (snake_case codes); STA-1578 (App Store guideline 4.8).
 */
import { Enum } from "@stackra/contracts";

/** The reasons a Sign in with Apple call is refused. */
export const AppleSignInRefusal = Enum.of({
  /** The device or OS cannot use Sign in with Apple (not iOS 13 or later); offer the hosted sign-in. */
  Unsupported: "unsupported",
  /** The person closed the system sheet. */
  Cancelled: "cancelled",
  /** Any other failure (no token came back, the request was not handled); the caller may retry. */
  Failed: "failed",
});

/** One of the codes above. */
export type AppleSignInRefusal = Enum.Value<typeof AppleSignInRefusal>;
