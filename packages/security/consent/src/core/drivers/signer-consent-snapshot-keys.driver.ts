/**
 * Stackra file contract:
 * Purpose: `SignerConsentSnapshotKeysDriver`, the `signer` driver of `ConsentSnapshotKeys`: the service that issues
 *          snapshots trusts its own bound `Signer`'s public key.
 * Boundary: reads the public key once and keeps it; a rotation restarts the process or binds the `static` driver with
 *           both keys. Never sees a private key.
 * Runtime: isomorphic
 * Governing contract: ADR 0472 (decision 2); ADR 0416; ADR 0263 (a driver is named by its class: `signer`).
 */
import { Driver } from "@stackra/container";
import type { Signer, SignerPublicKey } from "@stackra/contracts";

import { ConsentSnapshotKeys } from "#contracts/ports/consent-snapshot-keys.port";

/**
 * Trusts the bound signer's key.
 *
 * @example
 * const keys = new SignerConsentSnapshotKeysDriver(signer);
 */
export class SignerConsentSnapshotKeysDriver extends Driver(ConsentSnapshotKeys) {
  private readonly signer: Signer;

  private key: Promise<SignerPublicKey> | undefined;

  /**
   * @param signer - the key snapshots are signed with.
   */
  constructor(signer: Signer) {
    super();
    this.signer = signer;
  }

  /** The signer's public key, alone. */
  async trusted(): Promise<readonly SignerPublicKey[]> {
    this.key ??= this.signer.publicKey();
    return [await this.key];
  }
}
