/**
 * Stackra file contract:
 * Purpose: `LegacyConnectedAccountMode`, the fourth connection mode: `legacy-connected-account:<platform>`, an account
 *          a product already runs under its own Connect platform before cutover (A3-1), kept working as it is.
 * Boundary: a type only. The platform name is data; neither the cap nor the payout hold applies to it.
 * Runtime: isomorphic
 * Governing contract: A3-1; R4-6.
 */

/** `legacy-connected-account:<platform>`. */
export type LegacyConnectedAccountMode = `legacy-connected-account:${string}`;
