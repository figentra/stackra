/**
 * Stackra file contract:
 * Purpose: `Address`, the stand-in address model of this package's tests.
 * Boundary: test only; a plain stand-in, no database. Each test registers the declarations it needs and clears them.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; STA-1375.
 */

/** A stand-in address model. */
export class Address {
  id!: string;

  userId!: string;

  line!: string;
}
