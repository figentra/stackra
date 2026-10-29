/**
 * Stackra file contract:
 * Purpose: `signInWithPasskey`, the client half of a passkey sign-in: asks the BFF for a challenge, has the device's
 *          `Passkeys` driver sign it (`ExpoPasskeysDriver` on a phone), and sends the credential back to be checked.
 * Boundary: the two calls are the caller's (its generated client for `identity.passkey.challenge@1` and
 *           `identity.passkey.verify@1`), so the function knows no transport. A device refusal is returned, never
 *           thrown, and sends nothing; a server refusal throws from `verify`.
 * Runtime: isomorphic
 * Governing contract: ADR 0206 (decision 8); ADR 0140 (envelope shape); STA-1538.
 */
import type {
  PasskeyCredential,
  PasskeyRefusal,
  Passkeys,
  PasskeySignInChallenge,
} from "#contracts/index";

/**
 * Signs `loginName` in with a passkey; resolves to what `verify` answers, or the device's refusal.
 *
 * @example
 * const result = await signInWithPasskey(container.get(Passkeys), loginName, {
 *   challenge: (input) => client.identity.passkey.challenge(input),
 *   verify: (input) => client.identity.passkey.verify(input),
 * });
 * if (!result.ok && result.error === PasskeyRefusal.NoCredential) await session.signIn();
 */
export async function signInWithPasskey<T>(
  passkeys: Passkeys,
  loginName: string,
  calls: {
    readonly challenge: (input: { loginName: string }) => Promise<PasskeySignInChallenge>;
    readonly verify: (input: { sessionId: string; credential: PasskeyCredential }) => Promise<T>;
  },
): Promise<
  { readonly ok: true; readonly data: T } | { readonly ok: false; readonly error: PasskeyRefusal }
> {
  const { sessionId, options } = await calls.challenge({ loginName });
  const result = await passkeys.authenticate(options);
  if (!result.ok) return result;
  return { ok: true, data: await calls.verify({ sessionId, credential: result.data }) };
}
