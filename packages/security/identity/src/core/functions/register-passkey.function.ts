/**
 * Stackra file contract:
 * Purpose: `registerPasskey`, the client half of adding a passkey to the signed-in account: asks the BFF for the
 *          creation options, has the device's `Passkeys` driver create the key (`ExpoPasskeysDriver` on a phone), and
 *          sends the credential back to be kept under a name.
 * Boundary: the two calls are the caller's (its generated client for `identity.passkey.register@1` and
 *           `identity.passkey.confirm@1`), so the function knows no transport. A device refusal is returned, never
 *           thrown, and confirms nothing; a server refusal throws from `confirm`.
 * Runtime: isomorphic
 * Governing contract: ADR 0206 (decision 8); ADR 0140 (envelope shape); STA-1538.
 */
import type {
  PasskeyCredential,
  PasskeyRefusal,
  PasskeyRegistrationChallenge,
  Passkeys,
} from "#contracts/index";

/**
 * Adds a passkey named `name` to the signed-in account; resolves to `{ ok: true }` or the device's refusal.
 *
 * @example
 * const result = await registerPasskey(container.get(Passkeys), "iPhone", {
 *   register: () => client.identity.passkey.register({}),
 *   confirm: (input) => client.identity.passkey.confirm(input),
 * });
 */
export async function registerPasskey(
  passkeys: Passkeys,
  name: string,
  calls: {
    readonly register: () => Promise<PasskeyRegistrationChallenge>;
    readonly confirm: (input: {
      passkeyId: string;
      name: string;
      credential: PasskeyCredential;
    }) => Promise<unknown>;
  },
): Promise<{ readonly ok: true } | { readonly ok: false; readonly error: PasskeyRefusal }> {
  const { passkeyId, options } = await calls.register();
  const result = await passkeys.register(options);
  if (!result.ok) return result;
  await calls.confirm({ passkeyId, name, credential: result.data });
  return { ok: true };
}
