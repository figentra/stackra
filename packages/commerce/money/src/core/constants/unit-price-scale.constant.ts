/**
 * Stackra file contract:
 * Purpose: `UNIT_PRICE_SCALE`, the fraction digits of a unit price in major units: six, so a per-call or per-message
 *          price below one minor unit (`0.000123` USD) is exact.
 * Boundary: data only; mechanism, not policy: which items carry a unit price is catalogue data.
 * Runtime: isomorphic
 * Governing contract: ADR 0220 (decision 1: minor units for amounts); the OS-114 answer (6-decimal unit prices).
 */

/** Digits after the point a `UnitPrice` keeps. */
export const UNIT_PRICE_SCALE = 6;
