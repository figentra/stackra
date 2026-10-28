/**
 * Stackra file contract:
 * Purpose: `StaticConsentSnapshotKeysDriver`, the `static` driver of `ConsentSnapshotKeys`: a fixed list of public
 *          keys, for a Worker or service that verifies snapshots another service signs, and for a key rotation (the old
 *          and the new key listed together).
 * Boundary: holds public keys only; the host builds it from its deploy-time trust list and binds it by value. An empty
 *           list trusts nothing, so every snapshot reads as `untrusted_key`.
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
 * const keys = new StaticConsentSnapshotKeysDriver([currentKey, previousKey]);
 */
export class StaticConsentSnapshotKeysDriver extends Driver(ConsentSnapshotKeys) {
  private readonly keys: readonly SignerPublicKey[];

  /**
   * @param keys - every public key a trusted snapshot may name.
   */
  constructor(keys: readonly SignerPublicKey[]) {
    super();
    this.keys = Object.freeze([...keys]);
  }

  /** The keys handed in. */
  trusted(): Promise<readonly SignerPublicKey[]> {
    return Promise.resolve(this.keys);
  }
}
