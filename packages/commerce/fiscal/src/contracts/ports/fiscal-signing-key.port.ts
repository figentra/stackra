/**
 * Stackra file contract:
 * Purpose: `FiscalSigningKey`, the narrow host port behind `XadesEnvelopeSignerDriver`: the unit's private key signs
 *          bytes, and its certificate's public facts are read. The package builds the XAdES envelope; the host only
 *          holds the key (an HSM, a token, an encrypted key in its store).
 * Boundary: an abstract class that is its own token, key `fiscal.FiscalSigningKey`. The key never leaves the host;
 *           only signatures and public material come back. A leaf file.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 4); ADR 0173 (secrets stay with the host).
 */
import { Port } from "@stackra/contracts";

import type { SigningCertificate } from "#contracts/types/signing-certificate.type";

/**
 * One key and certificate per unit.
 *
 * @example
 * const signature = await key.sign("till_1", digestBytes); // base64 DER ECDSA-SHA256
 */
export abstract class FiscalSigningKey extends Port {
  /** Type-only port key. */
  declare readonly "~key": "fiscal.FiscalSigningKey";

  /**
   * The unit key's signature over `message` with SHA-256 (ECDSA on the certificate's curve), base64 DER.
   *
   * @throws when the unit has no key.
   */
  abstract sign(unitId: string, message: Uint8Array): Promise<string>;

  /** The unit's certificate facts; `null` when the unit has none yet. */
  abstract certificate(unitId: string): Promise<SigningCertificate | null>;
}
