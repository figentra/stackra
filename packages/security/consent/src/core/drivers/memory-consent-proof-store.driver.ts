/**
 * Stackra file contract:
 * Purpose: `MemoryConsentProofStoreDriver`, a `ConsentProofStore` held in memory, for tests and local runs.
 * Boundary: process-local and unsynchronised; never evidence. Append-only like the port.
 * Runtime: isomorphic
 * Governing contract: owner round 3 #29; ADR 0263 (a driver is named by its class: `memory`).
 */
import { Driver } from "@stackra/container";
import type { PublicId } from "@stackra/contracts";

import { ConsentProofStore } from "#contracts/ports/consent-proof-store.port";
import type { ConsentProof } from "#contracts/types/consent-proof.type";

/**
 * Proofs held in memory.
 *
 * @example
 * const proofs = new MemoryConsentProofStoreDriver();
 */
export class MemoryConsentProofStoreDriver extends Driver(ConsentProofStore) {
  /** Every proof, in the order appended. */
  private proofs: readonly ConsentProof[] = [];

  /** Appends `proof` to the in-memory list. */
  append(proof: ConsentProof): Promise<void> {
    this.proofs = [...this.proofs, Object.freeze({ ...proof })];
    return Promise.resolve();
  }

  /** The latest proof of `subject` for `document`. */
  latest(subject: PublicId, document: string): Promise<ConsentProof | undefined> {
    return Promise.resolve(
      this.proofs
        .filter((proof) => proof.subject === subject && proof.document === document)
        .at(-1),
    );
  }

  /** Every proof of `subject`, oldest first. */
  list(subject: PublicId): Promise<readonly ConsentProof[]> {
    return Promise.resolve(this.proofs.filter((proof) => proof.subject === subject));
  }
}
