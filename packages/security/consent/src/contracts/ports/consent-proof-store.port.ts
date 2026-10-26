/**
 * Stackra file contract:
 * Purpose: the `ConsentProofStore` port: the append-only store of consent proofs on the server: add one, read the
 *          latest for a subject and a document, list a subject's.
 * Boundary: an abstract class that is its own token, implemented by the service that owns the evidence (OS
 *           compliance) or the memory driver. Append-only: a proof is never edited or deleted here; erasure follows the
 *           owning service's retention rules. The rules are `ConsentProofService`'s.
 * Runtime: isomorphic
 * Governing contract: ADR 0298 (decision 3); owner round 3 #29; ADR 0263.
 */
import { Port, type PublicId } from "@stackra/contracts";

import type { ConsentProof } from "#contracts/types/consent-proof.type";

/**
 * Keeps consent proofs.
 *
 * @example
 * const latest = await proofs.latest(user.id, "terms");
 */
export abstract class ConsentProofStore extends Port {
  /** Appends `proof` to the append-only store. */
  abstract append(proof: ConsentProof): Promise<void>;

  /** The latest proof of `subject` for `document`, any version; `undefined` when none. */
  abstract latest(subject: PublicId, document: string): Promise<ConsentProof | undefined>;

  /** Every proof of `subject`, oldest first. */
  abstract list(subject: PublicId): Promise<readonly ConsentProof[]>;
}
