/**
 * Stackra file contract:
 * Purpose: `TillCredentialsFake`, an in-memory `TillCredentials` that records every read and write.
 * Boundary: built on `Fake` of @stackra/testing; holds secrets in plain memory, so it is for tests only.
 * Runtime: isomorphic
 * Governing contract: ADR 0269; ADR 0266 (decision 2); ADR 0364.
 */
import { Fake } from "@stackra/testing";

import { TillCredentials } from "#contracts/ports/till-credentials.port";
import type { TillCredential } from "#contracts/types/till-credential.type";

/**
 * One credential per unit in a Map.
 *
 * @example
 * const credentials = TillCredentialsFake.with([{ unitId: "till_1", stage: "production", … }]);
 */
export class TillCredentialsFake extends Fake.of(TillCredentials) {
  /** Credentials by unit. */
  private readonly stored = new Map<string, TillCredential>();

  /** Shorthand for a fake holding these credentials. */
  static with(credentials: readonly TillCredential[]): TillCredentialsFake {
    const fake = new TillCredentialsFake();
    for (const credential of credentials) fake.stored.set(credential.unitId, credential);
    return fake;
  }

  /** Recorded, then the stored credential. */
  async get(unitId: string): Promise<TillCredential | null> {
    this.record("get", unitId);
    return this.stored.get(unitId) ?? null;
  }

  /** Recorded, then stored. */
  async save(credential: TillCredential): Promise<void> {
    this.record("save", credential);
    this.stored.set(credential.unitId, credential);
  }
}
