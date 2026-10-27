/**
 * Stackra file contract:
 * Purpose: the `LicenceIssuer` port: how the issuing service writes licences at the licence server: create, renew with
 *          a new expiry and metadata, check out a freshly signed file, and suspend.
 * Boundary: an abstract class that is its own token, keyed `licensing.LicenceIssuer`, beside `LicenceVerifier`. Issuing
 *           runs only in the service that sells licences (OS licensing), never on an install; an install only verifies.
 *           Drivers: `registry` (`RegistryLicenceIssuerDriver`, the default), `keygen` (`KeygenLicenceIssuerDriver`,
 *           on-prem) and `memory` (`MemoryLicenceIssuerDriver`); `IssuerConfig` names the one in use.
 * Runtime: isomorphic
 * Governing contract: ADR 0178 (decisions 1 to 3); ADR 0263 (ports and drivers); OS ADR 0039 d5 and d7; ADR 0453 (decision 15).
 */
import { Port } from "@stackra/contracts";

import type { LicenceDraft } from "#core/types/licence-draft.type";

/**
 * Writes licences at the licence server.
 *
 * @example
 * const id = await issuer.create({ policyId, name: "Acme on-prem", expiry, metadata });
 * const file = await issuer.checkOut(id, 30 * 86_400);
 */
export abstract class LicenceIssuer extends Port {
  /** Type-only port key, so `DriverName<LicenceIssuer>` narrows to this port's drivers. */
  declare readonly "~key": "licensing.LicenceIssuer";

  /**
   * Creates a licence; returns the licence server's id.
   *
   * @throws LicenceIssuerUnavailableError when the server gives no usable answer; the caller retries.
   */
  abstract create(draft: LicenceDraft): Promise<string>;

  /**
   * Replaces the expiry and metadata of licence `id` (a renewal or a new snapshot).
   *
   * @throws LicenceIssuerUnavailableError.
   */
  abstract update(id: string, draft: Pick<LicenceDraft, "expiry" | "metadata">): Promise<void>;

  /**
   * A freshly signed licence file of `id`, with its metadata and entitlements, counting `ttlSeconds` (the licence's
   * own expiry when undefined).
   *
   * @throws LicenceIssuerUnavailableError.
   */
  abstract checkOut(id: string, ttlSeconds: number | undefined): Promise<string>;

  /**
   * Suspends licence `id`, so an online check and the next file show it suspended. Data on the install is never
   * touched (ADR 0178 decision 4).
   *
   * @throws LicenceIssuerUnavailableError.
   */
  abstract suspend(id: string): Promise<void>;
}
