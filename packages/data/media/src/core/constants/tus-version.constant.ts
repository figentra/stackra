/**
 * Stackra file contract:
 * Purpose: `TUS_VERSION`, the tus protocol version every tus request of this package names in `Tus-Resumable`.
 * Boundary: a constant, internal to this package; tus 1.0.0 is the only version tusd speaks.
 * Runtime: isomorphic
 * Governing contract: ADR 0222 (decision 2: tus uploads).
 */

/** The tus protocol version (`Tus-Resumable`). */
export const TUS_VERSION = "1.0.0";
