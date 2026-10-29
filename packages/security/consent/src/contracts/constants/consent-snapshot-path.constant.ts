/**
 * Stackra file contract:
 * Purpose: `CONSENT_SNAPSHOT_PATH`, the route of the consent endpoint (`POST /consent/snapshots`,
 *          `consent.consent_snapshot.issue@1`) that signs a `ConsentSnapshot` of the client's stored decision.
 * Boundary: a constant, in this leaf entry, so the client (`consentSnapshotHeaders`) and the action
 *           (`IssueConsentSnapshotAction`, which gen reads as a literal) name the same route; a test keeps them equal.
 * Runtime: isomorphic
 * Governing contract: ADR 0472 (decisions 1 and 6: an API call that answers in its body); ADR 0294 (decision 21).
 */

/**
 * The consent endpoint's path, under the API origin.
 *
 * @example
 * await fetch(`${apiOrigin}${CONSENT_SNAPSHOT_PATH}`, { method: "POST", body });
 */
export const CONSENT_SNAPSHOT_PATH = "/consent/snapshots";
