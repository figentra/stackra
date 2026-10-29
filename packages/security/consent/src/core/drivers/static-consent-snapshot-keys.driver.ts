/**
 * Stackra file contract:
 * Purpose: `StaticConsentSnapshotKeysDriver`, the `static` driver of `ConsentSnapshotKeys`: a fixed list of public
 *          keys, for a Worker or service that verifies snapshots another service signs, and for a key rotation (the old
 *          and the new key listed together).
 * Boundary: holds public keys only; the container builds it, and the host seeds it from its deploy-time trust list with
 *           `trust(keys)` (a call, not a constructor value: gen's `token_not_a_class`). Until seeded, or with an empty
 *           list, it trusts nothing, so every snapshot reads as `untrusted_key`.
 * Runtime: isomorphic
 * Governing contract: ADR 0472 (decision 2); ADR 0416; ADR 0263 (a driver is named by its class: `static`).
 */
import { Driver } from "@stackra/container";
import type { SignerPublicKey } from "@stackra/contracts";

import { ConsentSnapshotKeys } from "#contracts/ports/consent-snapshot-keys.port";

/**
 * Trusts a fixed list of keys.
 *
 * @example
 * const keys = new StaticConsentSnapshotKeysDriver().trust([currentKey, previousKey]);
 */
export class StaticConsentSnapshotKeysDriver extends Driver(ConsentSnapshotKeys) {
  /** The trusted keys; none until `trust` seeds them. */
  private keys: readonly SignerPublicKey[] = [];

  /** Replaces the trusted keys with `keys`, every public key a trusted snapshot may name. */
  trust(keys: readonly SignerPublicKey[]): this {
    this.keys = Object.freeze([...keys]);
    return this;
  }

  /** The keys handed in. */
  trusted(): Promise<readonly SignerPublicKey[]> {
    return Promise.resolve(this.keys);
  }
}
