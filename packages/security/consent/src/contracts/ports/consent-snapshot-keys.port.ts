/**
 * Stackra file contract:
 * Purpose: the `ConsentSnapshotKeys` port: the public keys a `ConsentSnapshotVerifier` trusts, by key id, so a server
 *          or a Worker checks a snapshot with public keys alone (ADR 0472 decision 2).
 * Boundary: an abstract class that is its own token. Drivers: `signer` (the bound `Signer`'s own key, for the service
 *           that issues and verifies) and `static` (a list handed in, for a Worker that only verifies; key rotation
 *           lists the old and the new key). It never returns a private key.
 * Runtime: isomorphic
 * Governing contract: ADR 0472 (decision 2); ADR 0416 (signer keys); ADR 0294 (decisions 16 and 17).
 */
import { Port } from "@stackra/contracts";
import type { SignerPublicKey } from "@stackra/contracts";

/**
 * The trusted snapshot keys.
 *
 * @example
 * const key = (await keys.trusted()).find((item) => item.keyId === keyId);
 */
export abstract class ConsentSnapshotKeys extends Port {
  /** Every public key a snapshot may be signed with. */
  abstract trusted(): Promise<readonly SignerPublicKey[]>;
}
