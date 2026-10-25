/**
 * Stackra file contract:
 * Purpose: `FiscalSigner`, the pluggable signer: an HSM, a USB token or a cloud seal signs with the unit's key.
 * Boundary: an abstract class that is its own token, key `fiscal.FiscalSigner`. Keys and certificates stay behind it;
 *           only public material comes back. A leaf file.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 4); ADR 0173 (secrets stay with the host).
 */
import { Port } from "@stackra/contracts";

import type { SignatureRequest } from "#contracts/types/signature-request.type";
import type { SignatureResult } from "#contracts/types/signature-result.type";

/**
 * Signs in the format the request names.
 *
 * @example
 * const { value } = await signer.sign({ unitId, format: SignatureFormat.Raw, payload, digest });
 */
export abstract class FiscalSigner extends Port {
  /** Type-only port key. */
  declare readonly "~key": "fiscal.FiscalSigner";

  /** The signature; throws when the unit has no key or the format is not supported. */
  abstract sign(request: SignatureRequest): Promise<SignatureResult>;
}
