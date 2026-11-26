/**
 * Stackra file contract:
 * Purpose: `credentialTrustOf`, how far a C2PA manifest store (c2pa-rs `Reader#json()`) is to be believed: `trusted`,
 *          `unverified` or `invalid`.
 * Boundary: pure. `trusted` needs both the store's `validation_state` `Trusted` and the active manifest's
 *           `signingCredential.trusted` success code, with no failure code; `invalid` is a state of `Invalid`, or
 *           validation failures without a state (older c2pa-rs); anything else, including a store with no state, is
 *           `unverified`. Which anchors the engine trusted is the reader's settings, not this function's.
 * Runtime: isomorphic
 * Governing contract: STA-2791 (CTO decision of 2026-11-25); C2PA 2.x validation states; COM-73, COM-294.
 */
import { ContentCredentialTrust } from "#contracts/enums/content-credential-trust.enum";
import type { C2paManifestStore } from "#node/types/c2pa-manifest-store.type";

/** The success code c2pa-rs gives a signer that chains to a configured anchor or is on the allowed list. */
const SIGNER_TRUSTED = "signingCredential.trusted";

/**
 * The trust `store` earns.
 *
 * @example
 * credentialTrustOf(reader.json()); // "unverified" for a signer on no trust list
 */
export function credentialTrustOf(store: C2paManifestStore): ContentCredentialTrust {
  if (store.validation_state === "Invalid") return ContentCredentialTrust.Invalid;
  if (store.validation_state === undefined && (store.validation_status?.length ?? 0) > 0)
    return ContentCredentialTrust.Invalid;
  const active = store.validation_results?.activeManifest;
  const trusted =
    store.validation_state === "Trusted" &&
    (active?.success ?? []).some(({ code }) => code === SIGNER_TRUSTED) &&
    (active?.failure?.length ?? 0) === 0;
  return trusted ? ContentCredentialTrust.Trusted : ContentCredentialTrust.Unverified;
}
