/**
 * Stackra file contract:
 * Purpose: `LicenceDraft`, what a `LicenceIssuer` caller hands over to create or renew a licence: the licence server's
 *          policy, a readable name, the expiry and the metadata the signed file carries.
 * Boundary: a type only. The metadata is whatever the issuing service puts in the file (OS writes its
 *           `LicenceFileMetadataV1` here); this package never reads its fields. A renewal passes `expiry` and
 *           `metadata` only.
 * Runtime: isomorphic
 * Governing contract: ADR 0178 (decisions 1 to 3); ADR 0263.
 */
import type { Json } from "@stackra/contracts";

/** One licence as the issuer writes it. */
export interface LicenceDraft {
  /** The licence server's policy id (Keygen's policy). */
  readonly policyId: string;

  /** A readable name. */
  readonly name: string;

  /** When the licence expires. */
  readonly expiry: Date;

  /** What the signed file carries; the licence server signs it with the file. */
  readonly metadata: Readonly<Record<string, Json>>;
}
