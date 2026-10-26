/**
 * Stackra file contract:
 * Purpose: `DeviceClaimFacts`, the facts the devices service knows when a person enters a pairing code and the
 *          registry records with the device: the tenant it belongs to, the market whose pack governs it (fiscal
 *          mandate, offline window) and the principal who paired it.
 * Boundary: a type only. The caller supplies every fact from its own context (the token's tenant, the location's
 *           market, the acting principal); the registry stores them as given and never resolves them.
 * Runtime: isomorphic
 * Governing contract: ADR 0361 (decision 7); OS 0016 (d2, d3: each pairing scoped to a tenant and node; d4: fiscal
 *                     onboarding by market).
 */

/** Who and where a claim happens for. */
export interface DeviceClaimFacts {
  /** The tenant the device joins; null in a single-tenant host. */
  readonly tenantId: string | null;

  /** The market pack key (`sa`, `eg`) that governs the device; null when not known yet. */
  readonly market: string | null;

  /** The principal who entered the code; null for an enrolment token or a system claim. */
  readonly pairedBy: string | null;
}
