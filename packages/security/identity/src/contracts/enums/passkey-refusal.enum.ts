/**
 * Stackra file contract:
 * Purpose: `PasskeyRefusal`, why the device did not hand back a passkey credential: passkeys cannot be used here, the
 *          person closed the sheet, no passkey for the site is on the device, one is already registered, or the request
 *          failed.
 * Boundary: an `Enum.of` value plus the type of the same name, provider-neutral snake_case codes; a `Passkeys` driver
 *           maps its library's errors to them. A refusal is a value the caller branches on, never a thrown error.
 * Runtime: isomorphic
 * Governing contract: ADR 0206 (decision 8); ADR 0231 (snake_case codes); STA-1538.
 */
import { Enum } from "@stackra/contracts";

/** The reasons a passkey call is refused. */
export const PasskeyRefusal = Enum.of({
  /** The device, the OS or the app's domain setup cannot use passkeys; offer another sign-in method. */
  Unsupported: "unsupported",
  /** The person closed the system sheet. */
  Cancelled: "cancelled",
  /** No passkey for this site is on the device. */
  NoCredential: "no_credential",
  /** Registration only: this device already holds a passkey for the account. */
  AlreadyRegistered: "already_registered",
  /** Any other failure (timeout, interruption, a challenge the device could not read); the caller may retry. */
  Failed: "failed",
});

/** One of the codes above. */
export type PasskeyRefusal = Enum.Value<typeof PasskeyRefusal>;
