/**
 * Stackra file contract:
 * Purpose: `ConsentProofEntry`, the persisted consent proof the Postgres proof store writes: one `ConsentProof` as
 *          given, and its place in its subject's hash chain.
 * Boundary: data and indexes. Key `consent.consent_proof_entry`, table `consent.consent_proof_entries` (the package's
 *           Postgres schema), public ids `cpf_…`. Tenant-owned through @stackra/tenancy's `BelongsToTenant` with the
 *           forced equality policy, so a session sees and extends only its tenant's proofs; append-only by trait, by
 *           revoking UPDATE and by a trigger that refuses one, so a proof is never edited and a later answer is a new
 *           row. Erasure follows the owning service's retention rules (a DELETE), which leaves the remaining chain
 *           verifiable from its oldest kept link. Ids only: the subject, the giver, the document key and version, the
 *           text's hash, never the text or a name. Its string fields carry no `@Str`: the column lengths are the
 *           migration's; `sequence` carries `@Int`, which gen needs to type a number. The ORM loads rows without
 *           running the constructor.
 * Runtime: node
 * Governing contract: ADR 0454 (decision 5: consent evidence records); ADR 0298 (decision 3); ADR 0212 (decision 3:
 *                     append-only, a hash chain); ADR 0294 (decisions 4, 20 and 27); ADR 0321 and 0323 d1
 *                     (`BelongsToTenant` is tenancy's); ADR 0239; ADR 0134; STA-2818.
 */
import { AppendOnly, HasPublicId, Index, Model } from "@stackra/model";
import { BelongsToTenant } from "@stackra/tenancy/node";
import { Int } from "@stackra/validation";

import type { ConsentVerificationMethod } from "#contracts/enums/consent-verification-method.enum";

/** One stored consent proof, a link of its subject's chain. */
@Index(["tenantId", "subject", "sequence"], { unique: true })
@Index(["tenantId", "subject", "document"])
export class ConsentProofEntry extends Model.with(HasPublicId("cpf"), BelongsToTenant, AppendOnly) {
  /** The proof's position in its subject's hash chain, from 1. */
  @Int({ min: 1 })
  sequence!: number;

  /** The public id of the person the consent is about. */
  subject!: string;

  /** The public id of who gave it: the subject, or the person acting for them. */
  givenBy!: string;

  /** How the giver stands to the subject when it is someone else; null when the subject answered. */
  relationship!: string | null;

  /** The document or purpose key. */
  document!: string;

  /** The document version answered. */
  version!: string;

  /** The hash of the exact text shown; null when the document has none. */
  contentHash!: string | null;

  /** Whether the person agreed. */
  granted!: boolean;

  /** When the answer was given. */
  at!: Date;

  /** Where it was given; null when the caller did not say. */
  channel!: string | null;

  /** The verification method the consent passed; null when none was required. */
  verificationMethod!: ConsentVerificationMethod | null;

  /** The verifier's id of that check; null when it gave none. */
  verificationReference!: string | null;

  /** The hash of the proof before it in the chain. */
  previousHash!: string;

  /** SHA-256 of the previous hash, the sequence and the proof. */
  hash!: string;
}
