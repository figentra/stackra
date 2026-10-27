/**
 * Stackra file contract:
 * Purpose: `SUBJECT`, the public id of the person every test case exports or erases.
 * Boundary: test only; a plain stand-in, no database. Each test registers the declarations it needs and clears them.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; STA-1375.
 */

/** The subject of every case. */
export const SUBJECT = "usr_01ja0000000000000000000001";
