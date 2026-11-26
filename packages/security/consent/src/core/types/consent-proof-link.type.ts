/**
 * Stackra file contract:
 * Purpose: `ConsentProofLink`, one consent proof as a durable store keeps it: the proof as written plus its place in
 *          its subject's hash chain (the sequence from 1, the previous link's hash and its own hash).
 * Boundary: a type only. `linkConsentProof` builds it and `findConsentProofChainBreak` checks a run of them; a store
 *           driver persists it and hands back the plain `ConsentProof`, so the port stays unchanged. Ids only, like the
 *           proof.
 * Runtime: isomorphic
 * Governing contract: ADR 0454 (decision 5: consent evidence records); ADR 0212 (decision 3: append-only, a hash
 *                     chain checked by verification); STA-2818.
 */
import type { ConsentProof } from "#contracts/types/consent-proof.type";

/** A consent proof chained after the one before it for the same subject. */
export interface ConsentProofLink extends ConsentProof {
  /** The link's position in its subject's chain, from 1. */
  readonly sequence: number;

  /** The hash of the link before it; 64 zeros for the first. */
  readonly previousHash: string;

  /** SHA-256 (lowercase hex) of the previous hash, the sequence and the proof. */
  readonly hash: string;
}
