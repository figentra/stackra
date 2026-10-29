/**
 * Stackra file contract:
 * Purpose: `ExpoPasskeysDriver`, the `Passkeys` of an Expo app: registration and sign-in through the platform's
 *          credential manager (`ASAuthorizationController` on iOS 15 and later, Credential Manager on Android 9 and
 *          later) by `react-native-passkey`, with the library's error codes mapped to `PasskeyRefusal`.
 * Boundary: the device step only, and a pass-through: the provider's options go in, its credential JSON comes out. The
 *           library is native code the app links (an optional peer, autolinked at prebuild, so no module package of
 *           ours, ADR 0478 decision 2). The relying party is the provider's domain: without it in the app's associated
 *           domains (`webcredentials:`) and its asset links, every call refuses `unsupported`.
 * Runtime: react-native
 * Governing contract: ADR 0206 (decision 8); ADR 0478 (decision 2); STA-1538.
 */
import { Driver } from "@stackra/container";
import { Passkey } from "react-native-passkey";
import type { PasskeyCreateRequest, PasskeyGetRequest } from "react-native-passkey";

import { PasskeyRefusal, Passkeys } from "#contracts/index";
import type {
  PasskeyCreationOptions,
  PasskeyCredential,
  PasskeyRequestOptions,
  PasskeyResult,
} from "#contracts/index";

/** `react-native-passkey`'s error codes to refusals; an unlisted code is `failed`. */
const REFUSAL_OF_ERROR: Readonly<Record<string, PasskeyRefusal>> = {
  NotSupported: PasskeyRefusal.Unsupported,
  NoCreateOption: PasskeyRefusal.Unsupported,
  BadConfiguration: PasskeyRefusal.Unsupported,
  UserCancelled: PasskeyRefusal.Cancelled,
  NoCredentials: PasskeyRefusal.NoCredential,
  CredentialAlreadyExists: PasskeyRefusal.AlreadyRegistered,
};

/**
 * Passkeys on a phone.
 *
 * @example
 * // generated .stackra/mobile/wiring.ts
 * { port: Passkeys, candidates: { expo: () => import("@stackra/identity/native").then((m) => m.ExpoPasskeysDriver) } }
 */
export class ExpoPasskeysDriver extends Driver(Passkeys) {
  /** Whether this phone's OS can use passkeys (iOS 15, Android 9 and later). */
  isSupported(): boolean {
    return Passkey.isSupported();
  }

  /** Creates a passkey through the system sheet. */
  register(options: PasskeyCreationOptions): Promise<PasskeyResult> {
    // the library types its arrays mutable; it only reads them
    return settle(() => Passkey.create(options as PasskeyCreateRequest));
  }

  /** Signs the challenge with a passkey the person picks in the system sheet. */
  authenticate(options: PasskeyRequestOptions): Promise<PasskeyResult> {
    return settle(() => Passkey.get(options as PasskeyGetRequest));
  }
}

/** Runs one library call: its credential, or the refusal its error code maps to; a non-library error rethrows. */
async function settle(
  call: () => Promise<{
    id: string;
    rawId?: string;
    authenticatorAttachment?: string;
    response: PasskeyCredential["response"];
  }>,
): Promise<PasskeyResult> {
  try {
    const { id, rawId, authenticatorAttachment, response } = await call();
    const data = { id, rawId: rawId ?? id, type: "public-key", response } as const;
    return {
      ok: true,
      data: authenticatorAttachment === undefined ? data : { ...data, authenticatorAttachment },
    };
  } catch (error) {
    const code = (error as { error?: unknown } | null)?.error;
    if (typeof code !== "string") throw error;
    return { ok: false, error: REFUSAL_OF_ERROR[code] ?? PasskeyRefusal.Failed };
  }
}
