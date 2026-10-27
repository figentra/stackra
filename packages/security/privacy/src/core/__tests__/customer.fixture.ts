/**
 * Stackra file contract:
 * Purpose: `Customer`, the stand-in customer model of this package's tests.
 * Boundary: test only; a plain stand-in, no database. Each test registers the declarations it needs and clears them.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; STA-1375.
 */

/** A stand-in customer model. */
export class Customer {
  id!: string;

  userId!: string;

  name!: string;

  phone!: string | null;
}
