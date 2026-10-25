/**
 * Stackra file contract:
 * Purpose: `LicenceKeyCheckOptions`, what `checkLicenceKey` takes: the Keygen account, the licence key, an optional
 *          machine fingerprint scope, and the transport and base URL to call through.
 * Boundary: a type only. The licence key is sent to Keygen only; it is never stored or logged.
 * Runtime: isomorphic
 * Governing contract: ADR 0178 (decision 5); ADR 0260 (calls go through the transport).
 */
import type { Transport } from "@stackra/transport";

/** One online key check. */
export interface LicenceKeyCheckOptions {
  /** The Keygen account id or slug. */
  readonly account: string;

  /** The licence key to check. */
  readonly licenceKey: string;

  /** Scope the check to this machine fingerprint, so a machine-locked licence answers for this install. */
  readonly fingerprint?: string;

  /** The transport to send through; `createTransport()` (the global fetch) when left out. */
  readonly transport?: Transport;

  /** The licence API origin; `LicensingConfig`'s default `apiUrl` when left out, or a self-hosted Keygen's. */
  readonly baseUrl?: string;
}
