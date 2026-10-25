/**
 * Stackra file contract:
 * Purpose: `TillCredentials`, the port of the per-unit fiscal credential store: a CSID per till, a signing
 *          certificate's serial.
 * Boundary: an abstract class that is its own token, key `fiscal.TillCredentials`. The host stores the secret
 *           encrypted (`FieldCipher`) and uses it in its `FiscalTransport` binding. A leaf file.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 4); ADR 0173.
 */
import { Port } from "@stackra/contracts";

import type { TillCredential } from "#contracts/types/till-credential.type";

/**
 * Reads and writes one credential per unit.
 *
 * @example
 * const credential = await credentials.get("till_1");
 */
export abstract class TillCredentials extends Port {
  /** Type-only port key. */
  declare readonly "~key": "fiscal.TillCredentials";

  /** The unit's current credential; `null` before onboarding. */
  abstract get(unitId: string): Promise<TillCredential | null>;

  /** Replaces the unit's credential. */
  abstract save(credential: TillCredential): Promise<void>;
}
