/**
 * Stackra file contract:
 * Purpose: the `Passkeys` port: the device step of a passkey registration or sign-in, handing the identity provider's
 *          WebAuthn options to the platform's credential manager (iCloud Keychain, Google Password Manager and other
 *          providers) and handing back the signed credential.
 * Boundary: an abstract class that is its own token, keyed `identity.Passkeys`. The driver never makes a challenge nor
 *           verifies one: the server side asks the provider (ZITADEL's session and user passkey APIs) for the options
 *           and sends the credential back. The relying party is the provider's domain, so a phone app needs that
 *           domain in its associated domains (`webcredentials:`) and asset links. Drivers: `MemoryPasskeysDriver` (`.`,
 *           tests and web) and `ExpoPasskeysDriver` (`./native`). Passkeys on the hosted sign-in page need none of
 *           this: the system authentication session of `SignInBrowser` offers them itself.
 * Runtime: isomorphic
 * Governing contract: ADR 0206 (decision 8); ADR 0268 (R3: no login UI of ours, a button is not a form); STA-1538.
 */
import { Port } from "@stackra/contracts";

import type { PasskeyCreationOptions } from "#contracts/types/passkey-creation-options.type";
import type { PasskeyRequestOptions } from "#contracts/types/passkey-request-options.type";
import type { PasskeyResult } from "#contracts/types/passkey-result.type";

/**
 * Creates and uses passkeys on this device.
 *
 * @example
 * const passkeys = useContainer().get(Passkeys);
 * if (passkeys.isSupported()) {
 *   const result = await passkeys.authenticate(await api.passkeyChallenge());
 *   if (result.ok) await api.passkeyVerify(result.data);
 * }
 */
export abstract class Passkeys extends Port {
  /** Type-only port key, so `DriverName<Passkeys>` narrows to this port's drivers. */
  declare readonly "~key": "identity.Passkeys";

  /** Whether this device and OS can use passkeys at all; the app hides its passkey button when not. */
  abstract isSupported(): boolean;

  /** Creates a passkey for the account in `options`; the credential goes to the provider to register. */
  abstract register(options: PasskeyCreationOptions): Promise<PasskeyResult>;

  /** Signs `options`' challenge with a passkey the person picks; the credential goes to the provider to check. */
  abstract authenticate(options: PasskeyRequestOptions): Promise<PasskeyResult>;
}
